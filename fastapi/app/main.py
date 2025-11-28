from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional, Literal, Tuple
import os, base64, json, tempfile, logging, re, time, hashlib, hmac, threading, shutil

import requests
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption
from cryptography.hazmat.primitives.serialization.pkcs12 import load_key_and_certificates

# ====== App & CORS ======
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("dotz-proxy")

# ====== Config (ENV) ======
DOTZ_ENV = os.getenv("DOTZ_ENV", "uat").lower()  # "uat" | "prod"
CLIENT_ID_ENV = os.getenv("DOTZ_CLIENT_ID", "")
CLIENT_SECRET_ENV = os.getenv("DOTZ_CLIENT_SECRET", "")
CNPJ_ID_ENV = os.getenv("DOTZ_CNPJ_ID", "")
PFX_PATH_ENV = os.getenv("DOTZ_PFX_PATH", "")
PFX_PASS_ENV = os.getenv("DOTZ_PFX_PASS", "")
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "30"))

# Auth mode: 'api-key' | 'jwt'
AUTH_MODE = os.getenv("AUTH_MODE", "api-key").lower()
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")  # usado quando AUTH_MODE=api-key

# JWT (usado quando AUTH_MODE=jwt) — requer PyJWT (opcional)
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_AUDIENCE = os.getenv("JWT_AUD", "fastapi-ssl")
JWT_ISSUER = os.getenv("JWT_ISS", "n8n")
JWT_ALG = os.getenv("JWT_ALG", "HS256")

# Cache de PEMs (TTL e tamanho máx.)
CERT_CACHE_TTL = int(os.getenv("CERT_CACHE_TTL", "300"))          # segundos; 0/negativo = desabilita cache
CERT_CACHE_MAX_ENTRIES = int(os.getenv("CERT_CACHE_MAX_ENTRIES", "50"))

# ====== Util ======
def base_url(env: str) -> str:
    env = (env or "uat").lower()
    return "https://uat-loyalty.dotznext.com" if env == "uat" else "https://loyalty.dotz.com.br"

def basic_auth_header(client_id: str, client_secret: str) -> str:
    token = base64.b64encode(f"{client_id}:{client_secret}".encode("utf-8")).decode("utf-8")
    return f"Basic {token}"

def pick(value: Optional[str], fallback: str) -> str:
    return value if (value is not None and value != "") else fallback

# ====== Modelos ======
class CertModel(BaseModel):
    pfx_base64: Optional[str] = Field(None, description="Certificado .pfx em base64")
    pfx_path:   Optional[str] = Field(None, description="Caminho do .pfx dentro do container")
    password:   Optional[str] = Field(None, description="Senha do .pfx")

class AuthModel(BaseModel):
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    cnpj_id: Optional[str] = None  # 14 dígitos

class RouterModel(BaseModel):
    env: Literal["uat", "prod"] = "uat"

class Envelope(BaseModel):
    router: Optional[RouterModel] = None
    auth: Optional[AuthModel] = None
    cert: Optional[CertModel] = None
    data: Optional[Dict[str, Any]] = None  # payload Dotz (opção A)
    # alternativa (opção B) — raiz:
    route: Optional[str] = None
    version: Optional[int] = None
    input: Optional[Dict[str, Any]] = None
    comando: Optional[str] = None  # alias para route

# ====== Auth ======
def validate_request_auth(req: Request):
    """
    Enforce auth no início da requisição.
    api-key: Header 'X-API-Key' deve bater com INTERNAL_API_KEY (se setado).
    jwt: Bearer JWT em Authorization com secret HS256 (se configurado).
    """
    if AUTH_MODE == "api-key":
        # Se INTERNAL_API_KEY não estiver configurada, não bloqueia (modo aberto).
        if not INTERNAL_API_KEY:
            return
        provided = req.headers.get("x-api-key")
        if not provided or not hmac.compare_digest(provided, INTERNAL_API_KEY):
            raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key.")
        return

    if AUTH_MODE == "jwt":
        # Requer PyJWT (pip install PyJWT) — deixe opcional
        try:
            import jwt  # type: ignore
        except Exception:
            raise HTTPException(status_code=500, detail="JWT auth enabled but PyJWT not installed.")
        if not JWT_SECRET:
            raise HTTPException(status_code=500, detail="JWT auth enabled but JWT_SECRET not configured.")

        auth = req.headers.get("authorization")
        if not auth or not auth.lower().startswith("bearer "):
            raise HTTPException(status_code=401, detail="Missing Bearer token.")
        token = auth.split(" ", 1)[1].strip()
        try:
            jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG], audience=JWT_AUDIENCE, issuer=JWT_ISSUER)
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
        return

    # Fallback: sem auth
    return

# ====== Payload builder ======
def build_dotz_payload(src: Dict[str, Any]) -> Dict[str, Any]:
    # A) {"data": {"route": "...", "version": 1, "input": {...}}}
    if "data" in src and isinstance(src["data"], dict):
        data = src["data"]
        for k in ["route", "version", "input"]:
            if k not in data:
                raise HTTPException(status_code=400, detail=f"Campo obrigatório ausente em data: '{k}'")
        return {"data": data}

    # B) {"route": "...", "version": 1, "input": {...}}
    route = src.get("route") or src.get("comando")
    version = src.get("version", 1)
    input_obj = src.get("input") or src.get("payload") or src.get("dados") or {}

    if not route:
        raise HTTPException(status_code=400, detail="Campo 'route' (ou 'comando') é obrigatório.")
    if not isinstance(version, int):
        raise HTTPException(status_code=400, detail="Campo 'version' deve ser inteiro.")
    if not isinstance(input_obj, dict):
        raise HTTPException(status_code=400, detail="Campo 'input' deve ser um objeto JSON.")

    return {"data": {"route": route, "version": version, "input": input_obj}}

# ====== PFX → PEM (com cache TTL) ======
# Cache em memória: key -> (expires_at, cert_pem_bytes, key_pem_bytes)
_CERT_CACHE: Dict[str, Tuple[float, bytes, bytes]] = {}
_CERT_LOCK = threading.Lock()

def _extract_pem_from_pfx_bytes(pfx_bytes: bytes, pfx_pass: str) -> Tuple[bytes, bytes]:
    private_key, cert, chain = load_key_and_certificates(pfx_bytes, pfx_pass.encode() if pfx_pass else None)
    if cert is None or private_key is None:
        raise HTTPException(status_code=400, detail="Falha ao carregar chave/cert do PFX.")
    cert_pem = cert.public_bytes(Encoding.PEM)
    if chain:
        for c in chain:
            cert_pem += c.public_bytes(Encoding.PEM)
    key_pem = private_key.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, NoEncryption())
    return cert_pem, key_pem

def _cache_key_for_pfx(pfx_bytes: bytes, pfx_pass: str) -> str:
    h = hashlib.sha256()
    h.update(pfx_bytes)
    h.update(b"\x00")
    h.update(pfx_pass.encode())
    return h.hexdigest()

def get_pem_from_pfx_cached(pfx_bytes: bytes, pfx_pass: str) -> Tuple[bytes, bytes]:
    """Retorna (cert_pem_bytes, key_pem_bytes) usando cache TTL se habilitado."""
    if CERT_CACHE_TTL <= 0:
        return _extract_pem_from_pfx_bytes(pfx_bytes, pfx_pass)

    key = _cache_key_for_pfx(pfx_bytes, pfx_pass)
    now = time.time()

    with _CERT_LOCK:
        entry = _CERT_CACHE.get(key)
        if entry and entry[0] > now:
            # hit
            return entry[1], entry[2]

    # miss ou expirado
    cert_pem, key_pem = _extract_pem_from_pfx_bytes(pfx_bytes, pfx_pass)
    expires = now + CERT_CACHE_TTL

    with _CERT_LOCK:
        # limpeza básica de expirados
        expired = [k for k, v in _CERT_CACHE.items() if v[0] <= now]
        for kx in expired:
            _CERT_CACHE.pop(kx, None)
        # se ainda passou do limite, corta o mais antigo (heurística simples)
        if len(_CERT_CACHE) >= CERT_CACHE_MAX_ENTRIES:
            oldest_key = min(_CERT_CACHE.items(), key=lambda kv: kv[1][0])[0]
            _CERT_CACHE.pop(oldest_key, None)
        _CERT_CACHE[key] = (expires, cert_pem, key_pem)

    return cert_pem, key_pem

def write_temp_pem_files(cert_pem: bytes, key_pem: bytes) -> Tuple[str, str, str]:
    tmpdir = tempfile.mkdtemp(prefix="dotz_pem_")
    cert_file = os.path.join(tmpdir, "cert.pem")
    key_file = os.path.join(tmpdir, "key.pem")
    with open(cert_file, "wb") as f:
        f.write(cert_pem)
    with open(key_file, "wb") as f:
        f.write(key_pem)
    return tmpdir, cert_file, key_file

def read_pfx_bytes_from_env_path() -> bytes:
    if not PFX_PATH_ENV or not os.path.exists(PFX_PATH_ENV) or os.path.isdir(PFX_PATH_ENV):
        raise HTTPException(status_code=400, detail=f"DOTZ_PFX_PATH inválido: {PFX_PATH_ENV}")
    return open(PFX_PATH_ENV, "rb").read()

# ====== Endpoint ======
@app.post("/secure-request")
async def secure_request(req: Request):
    # 0) Auth
    validate_request_auth(req)

    # 1) Body
    try:
        body = await req.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Body inválido. Envie application/json.")

    env = Envelope(**body)

    # 2) URL
    env_name = env.router.env if env.router else (DOTZ_ENV or "uat")
    dotz_url = f"{base_url(env_name)}/v1/command"

    # 3) Credenciais
    client_id = pick(env.auth.client_id if env.auth else None, CLIENT_ID_ENV)
    client_secret = pick(env.auth.client_secret if env.auth else None, CLIENT_SECRET_ENV)
    cnpj_id = pick(env.auth.cnpj_id if env.auth else None, CNPJ_ID_ENV)

    if not client_id or not client_secret:
        raise HTTPException(status_code=400, detail="client_id/client_secret ausentes (envie em auth.* ou configure DOTZ_CLIENT_ID/DOTZ_CLIENT_SECRET).")
    if not cnpj_id or not re.fullmatch(r"\d{14}", cnpj_id):
        raise HTTPException(status_code=400, detail="cnpj_id ausente ou inválido (14 dígitos).")

    # 4) Certificado (PFX) — preferir base64; senão path; senão env
    try:
        if env.cert and env.cert.pfx_base64:
            if not env.cert.password:
                raise HTTPException(status_code=400, detail="Senha do PFX obrigatória quando usar pfx_base64.")
            pfx_bytes = base64.b64decode(env.cert.pfx_base64)
            cert_pem, key_pem = get_pem_from_pfx_cached(pfx_bytes, env.cert.password)

        elif env.cert and env.cert.pfx_path:
            if not env.cert.password:
                raise HTTPException(status_code=400, detail="Senha do PFX obrigatória quando usar pfx_path.")
            if not os.path.exists(env.cert.pfx_path) or os.path.isdir(env.cert.pfx_path):
                raise HTTPException(status_code=400, detail=f"pfx_path inválido: {env.cert.pfx_path}")
            pfx_bytes = open(env.cert.pfx_path, "rb").read()
            cert_pem, key_pem = get_pem_from_pfx_cached(pfx_bytes, env.cert.password)

        else:
            # fallback env
            if not PFX_PATH_ENV or not PFX_PASS_ENV:
                raise HTTPException(status_code=400, detail="PFX não informado. Envie em cert.* ou configure DOTZ_PFX_PATH/DOTZ_PFX_PASS.")
            pfx_bytes = read_pfx_bytes_from_env_path()
            cert_pem, key_pem = get_pem_from_pfx_cached(pfx_bytes, PFX_PASS_ENV)

        # 5) Payload Dotz
        payload_source = env.data if env.data else body
        dotz_payload = build_dotz_payload(payload_source)

        headers = {
            "Authorization": basic_auth_header(client_id, client_secret),
            "Id": cnpj_id,
            "Content-Type": "application/json",
        }

        # 6) Escreve PEMs temporários (a partir do cache) e chama
        tmpdir, cert_file, key_file = write_temp_pem_files(cert_pem, key_pem)
        try:
            resp = requests.post(
                dotz_url,
                headers=headers,
                data=json.dumps(dotz_payload),
                cert=(cert_file, key_file),
                verify=True,
                timeout=REQUEST_TIMEOUT,
            )
        finally:
            # apaga arquivos temporários, mas mantém cache em memória
            try:
                shutil.rmtree(tmpdir, ignore_errors=True)
            except Exception:
                pass

        content_type = resp.headers.get("content-type", "")
        try:
            resp_body = resp.json() if "application/json" in content_type else resp.text
        except Exception:
            resp_body = resp.text

        return {"status_code": resp.status_code, "url": dotz_url, "response": resp_body}

    except HTTPException:
        raise
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Timeout ao chamar o Dotz Router")
    except requests.exceptions.SSLError as e:
        raise HTTPException(status_code=502, detail=f"Falha SSL/mTLS ao chamar o Dotz Router: {e}")
    except Exception as e:
        log.exception("Erro inesperado")
        raise HTTPException(status_code=500, detail=str(e))
