## Objetivo

Ao concluir o pagamento no fluxo `webapp` (tela `/confirmacao_pagamento_webapp`), navegar para `/confirmacao_pagamento` exibindo o checkout com valores pagos (mesma experiência do fluxo APP, conforme imagem anexada).

## Diagnóstico

- `ConfirmacaoPagamentoWebappScreen.tsx` já chama `navigate('/confirmacao_pagamento', { state: { fromWebappScreen: true } })` após o polling completar e grava `orderData` no localStorage.
- Porém, `ConfirmacaoPagamentoScreen.tsx` só reconhece `fromAppScreen` / `fromTokenScreen`. Sem reconhecer `fromWebappScreen`, ele não monta o resumo do pagamento (subtotal, recebido, etc.) como na imagem.

## Mudança

**Arquivo:** `src/pages/ConfirmacaoPagamentoScreen.tsx`

1. Na linha 49, ampliar a flag para considerar também o fluxo webapp:
   ```ts
   const comingFromAppScreen = location.state?.fromAppScreen || location.state?.fromWebappScreen || false;
   ```
   Assim toda a lógica existente (carregamento de `orderData`, RLIPAYS, exibição do resumo, navegação) é reaproveitada sem duplicação.

2. Nenhuma alteração na `ConfirmacaoPagamentoWebappScreen.tsx` (já envia `fromWebappScreen: true` e `orderData` no localStorage com a mesma estrutura usada pelo fluxo APP).

## Resultado esperado

- Cliente finaliza no webapp → polling detecta `next_step != RLIWAIT` → botão "Finalizar Pagamento" aparece → clique leva a `/confirmacao_pagamento` exibindo o checkout com SubTotal, Desconto, Recebido e meios de pagamento, idêntico ao fluxo APP.
