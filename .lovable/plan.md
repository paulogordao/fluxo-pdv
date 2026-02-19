
## Alteração de Domínio: umbrelosn8n → n8n-prod

### Escopo da Alteração

Substituição de `https://umbrelosn8n.plsm.com.br` por `https://n8n-prod.plsm.com.br` em **2 arquivos**, totalizando **3 ocorrências**.

---

### Arquivo 1: src/config/api.ts (CRÍTICO)

Este é o arquivo central de configuração da API. É a única fonte de verdade para a URL base usada por **todos os serviços** do frontend. A alteração aqui reflete imediatamente em toda a aplicação.

**Linha 6 — antes:**
```
baseUrl: 'https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV',
```

**Linha 6 — depois:**
```
baseUrl: 'https://n8n-prod.plsm.com.br/webhook/simuladorPDV',
```

---

### Arquivo 2: docs/API_ENDPOINTS.md (Documentação)

Duas ocorrências a serem atualizadas para manter a documentação sincronizada com o ambiente de produção:

**Linha 5 — Seção "Configuração Base":**
```
**Base URL:** `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV`
```
→
```
**Base URL:** `https://n8n-prod.plsm.com.br/webhook/simuladorPDV`
```

**Linha 1897 — Seção "Guia Postman":**
```
- `base_url`: `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV`
```
→
```
- `base_url`: `https://n8n-prod.plsm.com.br/webhook/simuladorPDV`
```

---

### Impacto da Alteração

- O path `/webhook/simuladorPDV` permanece inalterado
- A API Key (`x-api-key`) permanece inalterada
- Todos os endpoints e serviços continuarão funcionando normalmente — apenas o host muda
- Nenhuma alteração em lógica, componentes ou fluxos de dados

---

### Resumo

| Arquivo | Linha(s) | Impacto |
|---------|----------|---------|
| `src/config/api.ts` | 6 | Produção (aplicação) |
| `docs/API_ENDPOINTS.md` | 5 e 1897 | Documentação |
