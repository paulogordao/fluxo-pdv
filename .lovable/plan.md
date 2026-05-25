## Objetivo

Quando `token.type === 'otp-server'` no retorno do serviço RLIDEAL, exibir o título **"Aguardando pagamento com Token"** na tela `/confirmacao_pagamento_token` (sem o "no APP").

Para `token.type === 'otp'` (fluxo já existente), manter o texto atual: **"Aguardando pagamento com Token no APP"**.

## Mudanças

**`src/pages/ConfirmacaoPagamentoTokenScreen.tsx`**

1. No `useEffect` que faz parse de `rlidealResponse` (linhas ~49-72), extrair `token.type` da resposta e armazenar em um novo state `tokenType`.
2. Substituir o `<h3>` fixo (linha 213-215) por um título condicional:
   - `tokenType === 'otp-server'` → `"Aguardando pagamento com Token"`
   - caso contrário → `"Aguardando pagamento com Token no APP"`

Nenhuma outra lógica (RLIAUTH, teclado, validação, modais) é alterada.