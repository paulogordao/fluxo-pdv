
## Alteração do Header: `id_usuario` → `id-usuario`

### Escopo

Substituição da chave do header HTTP `'id_usuario'` por `'id-usuario'` em **7 arquivos de serviço**, totalizando **19 ocorrências**. Nenhuma alteração em lógica de negócio, telas, hooks ou dados.

**Importante:** A alteração é **somente na chave do header** (ex: `'id_usuario': userId` → `'id-usuario': userId`). Os valores dos campos de dados, interfaces TypeScript, query params e respostas JSON **não são tocados**.

---

### Arquivos e Ocorrências

#### 1. `src/services/authService.ts` — 1 ocorrência
Função `resetPassword`, linha 73:
```
"id_usuario": userId  →  "id-usuario": userId
```

#### 2. `src/services/userService.ts` — 5 ocorrências
- `createUser` — linha 46
- `getUsers` — linha 63
- `getUserById` — linha 81
- `updateUser` — linha 99
- `getAccessRequests` — linha 117

```
'id_usuario': userId  →  'id-usuario': userId
```

#### 3. `src/services/testUserService.ts` — 3 ocorrências
- `getUsuariosTeste` — linha 30
- `createUsuarioTeste` — linha 71
- `updateUsuarioTeste` — linha 96

```
"id_usuario": userId  →  "id-usuario": userId
```

#### 4. `src/services/empresaService.ts` — 4 ocorrências
- `getEmpresas` — linha 43
- `getEmpresaById` — linha 67
- `createEmpresa` — linha 96
- `updateEmpresa` — linha 126

```
'id_usuario': userId  →  'id-usuario': userId
```

#### 5. `src/services/credentialsService.ts` — 6 ocorrências
- `createCredential` — linha 53
- `getCredentials` — linha 78
- `getCredentialById` — linha 114
- `updateCredentialStatus` — linha 138
- `checkCredentialHealth` — linha 163
- `getCredentialByUser` — linha 195

```
'id_usuario': userId  →  'id-usuario': userId
```

#### 6. `src/services/transacaoService.ts` — 3 ocorrências
- `buscarTransacoes` — linha 24
- `buscarTransacoesPays` — linha 70
- `estornarTransacao` — linha 116

```
'id_usuario': userId  →  'id-usuario': userId
```

#### 7. `src/services/comandoService.ts` — 1 ocorrência
Função principal `makeRequest` — linha 330:
```
'id_usuario': userId  →  'id-usuario': userId
```

#### 8. `src/services/consultaFluxoService.ts` — 2 ocorrências
- `consultarFluxo` — linha 38
- `consultarFluxoDetalhe` — linha 87

```
'id_usuario': userId  →  'id-usuario': userId
```

---

### O que NÃO muda

| Item | Motivo |
|------|--------|
| Interfaces TypeScript (`id_usuario?: string`) | Campo de dados da API, não header HTTP |
| Query params (`?id_usuario_consulta=...`) | Parâmetros de URL, não headers |
| Corpo JSON das requisições | Dados enviados no body |
| `localStorage`/`sessionStorage` | Armazenamento local da sessão |
| `permissionService.ts` | Já usa query param, sem header `id_usuario` |

---

### Resumo

| Arquivo | Ocorrências |
|---------|-------------|
| `authService.ts` | 1 |
| `userService.ts` | 5 |
| `testUserService.ts` | 3 |
| `empresaService.ts` | 4 |
| `credentialsService.ts` | 6 |
| `transacaoService.ts` | 3 |
| `comandoService.ts` | 1 |
| `consultaFluxoService.ts` | 2 |
| **Total** | **25** |
