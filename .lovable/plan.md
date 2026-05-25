## Plano: Suportar novos slugs `otp-server` e `webapp` na resposta do RLIDEAL

### Roteamento atual (em `MeiosDePagamentoScreen.tsx`)
Hoje, após RLIDEAL, o switch sobre `token.type` cobre:
- `birthdate` → `/otp_data_nascimento`
- `otp` → `/confirmacao_pagamento_token`
- senão, app/none → telas existentes

### Mudanças

**1. `src/pages/MeiosDePagamentoScreen.tsx`**
- Normalizar `token.type` para minúsculas uma vez.
- Adicionar dois novos casos:
  - `otp-server` → navegar para `/confirmacao_pagamento_token` (mesma tela do `otp`).
  - `webapp` → navegar para nova rota `/confirmacao_pagamento_webapp`.
- Demais comportamentos inalterados.

**2. Nova tela `src/pages/ConfirmacaoPagamentoWebappScreen.tsx`**
- Baseada em `ConfirmacaoPagamentoAppScreen.tsx`, reutilizando `useRliwaitPolling` com `transactionId` e o mesmo fluxo de cancel/conclusão.
- Texto/visual ajustado: ao invés de "Aguardando confirmação no App", indicar que o cliente está concluindo o resgate no celular (webapp). Ícone/ilustração e copy adaptados.
- `TechnicalFooter` com `slug="RLIDEALRLIWAIT"` e `sourceScreen="confirmacao_pagamento_webapp"`.
- Mesma navegação pós-polling do fluxo app.

**3. `src/App.tsx`**
- Registrar a rota `/confirmacao_pagamento_webapp` apontando para o novo componente.

### Detalhes técnicos
- Em `handleRlidealCall`, substituir as comparações por:
  ```ts
  const tokenType = tokenInfo?.type?.toLowerCase();
  if (tokenInfo?.required && tokenType === 'birthdate') navigate('/otp_data_nascimento');
  else if (tokenInfo?.required && (tokenType === 'otp' || tokenType === 'otp-server')) navigate('/confirmacao_pagamento_token');
  else if (tokenType === 'webapp') navigate('/confirmacao_pagamento_webapp');
  else if (option === 'app') navigate('/confirmacao_pagamento_app');
  else navigate('/confirmacao_pagamento', { state: { fromRlidealNoneOption: true } });
  ```
- Para `webapp`, o slug pode vir mesmo com `required=false`; por isso o teste de `webapp` ignora `required`. Confirmar comportamento na primeira execução real.
- Nenhuma alteração em `comandoService` nem em `useRliwaitPolling`.

### Arquivos
| Arquivo | Mudança |
|---|---|
| `src/pages/MeiosDePagamentoScreen.tsx` | Adicionar casos `otp-server` e `webapp` no roteamento pós-RLIDEAL |
| `src/pages/ConfirmacaoPagamentoWebappScreen.tsx` | Nova tela com polling RLIWAIT e copy de webapp |
| `src/App.tsx` | Registrar rota `/confirmacao_pagamento_webapp` |