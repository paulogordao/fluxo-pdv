## Plano: Exibir opção BNPL em /meios_de_pagamento

### Contexto

O serviço RLIFUND agora retorna um novo slug `bnpl` em `payment_options`. Hoje o hook `useFundPaymentOptions` mapeia apenas `app`, `outros_pagamentos`/`livelo` e `dotz` de forma hardcoded, ignorando qualquer outro slug — por isso BNPL não aparece. Conforme alinhado, a opção deve ser renderizada usando o `message` vindo do FUND e na **ordem** em que o backend retornar.

### Alteração

Refatorar `src/hooks/useFundPaymentOptions.ts` para iterar dinamicamente sobre o array `payment_options` retornado pelo FUND ao invés de fazer lookup hardcoded por slug.

1. Substituir os 3 `find()` (app, outros_pagamentos/livelo, dotz) por um `map()` que percorre `fundOptions` na ordem original.
2. Para cada item, gerar `{ id: opt.option, label: \`${index+1}. ${opt.message}\`, available: true }`.
3. Manter a opção fixa **"Nenhum"** sempre como último item da lista (não vem do FUND).
4. Preservar compatibilidade: slug `livelo` continua sendo aceito como sinônimo de `outros_pagamentos` (já é o valor original retornado, então o `map` natural já cobre).
5. Não alterar `getDefaultOptions()` (modo OFFLINE permanece igual).

Nenhuma mudança necessária em `MeiosDePagamentoScreen.tsx`:
- O `map(currentPaymentOptions)` já renderiza dinamicamente o que o hook devolver.
- `handleRlidealCall` já encaminha qualquer `option` recebido como `payment_option` para o RLIDEAL — então clicar em BNPL fará a chamada padrão com `payment_option: "bnpl"`.

### Fluxo pós-seleção

Por ora, ao selecionar BNPL será disparado o fluxo RLIDEAL padrão (mesmo caminho de `livelo`/`dotz`), e a navegação subsequente seguirá a resposta do backend (token, app, etc.). Em uma próxima iteração trataremos um fluxo específico para BNPL quando você tiver mais informações.

### Arquivo alterado

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useFundPaymentOptions.ts` | Mapear `payment_options` dinamicamente na ordem do FUND para suportar `bnpl` e quaisquer novos slugs futuros |
