# E2E Tests com Playwright

Este diretório contém os testes End-to-End (E2E) do simulador de PDV usando Playwright.

## 📋 Pré-requisitos

- Node.js 18.x ou 20.x
- npm ou bun instalado
- Usuário de teste configurado no ambiente UAT
- Aplicação rodando localmente na porta 8080

## 🚀 Como Executar

### 1. Instalar dependências do Playwright

```bash
npx playwright install
```

Isso irá instalar os navegadores necessários (Chromium, Firefox, WebKit).

### 2. Executar todos os testes

```bash
npm run test:e2e
```

### 3. Executar com interface gráfica (UI Mode)

```bash
npm run test:e2e:ui
```

Permite executar testes de forma interativa, com visualização passo a passo.

### 4. Executar com navegador visível (Headed Mode)

```bash
npm run test:e2e:headed
```

Útil para debug - mostra o navegador durante a execução dos testes.

### 5. Ver relatório de testes

```bash
npm run test:e2e:report
```

Abre o relatório HTML com resultados detalhados, screenshots e vídeos de falhas.

## 📁 Estrutura de Arquivos

```
e2e/
├── fixtures/
│   └── test-data.ts          # Credenciais e dados de teste
├── payment-token-flow.spec.ts # Teste principal do fluxo de pagamento
└── README.md                  # Este arquivo
```

## 🧪 Cenários de Teste

### Fluxo de Pagamento com Token - Versão 2 Online

**Cenário 1: Rejeição de Token Inválido** ✅
- **Objetivo**: Verificar que o sistema rejeita corretamente um token inválido
- **Fluxo**:
  1. Login com credenciais de teste UAT V2
  2. Navegar para Index → CPF → Scan → Meios de Pagamento
  3. Selecionar "Pagar com APP"
  4. Inserir token inválido: `182101`
  5. Verificar que modal de erro é exibido
- **Resultado Esperado**: Modal de validação aparece com mensagem de erro
- **Critério de Sucesso**: Sistema corretamente rejeita o token inválido

**Cenário 2: Cancelamento Durante Entrada de Token** ✅
- **Objetivo**: Verificar que o usuário pode cancelar a entrada do token
- **Fluxo**:
  1. Navegar até a tela de token
  2. Inserir token parcial
  3. Clicar em "Cancelar"
  4. Verificar retorno para tela de meios de pagamento
- **Resultado Esperado**: Navegação de volta para `/meios_de_pagamento`

## 📊 Dados de Teste

Os dados de teste estão centralizados em `e2e/fixtures/test-data.ts`:

```typescript
{
  email: 'teste_e2e_uat_v2@teste.com',
  password: 'HMdq0xZ8K7mpYo7L2Ljy',
  cpf: '32373222884',
  token: '182101' // Token inválido (esperado ser rejeitado)
}
```

## 🔍 Seletores de Teste

Os testes usam atributos `data-testid` para identificar elementos:

| Screen | Element | data-testid |
|--------|---------|-------------|
| Login | Email input | `email-input` |
| Login | Password input | `password-input` |
| Login | Login button | `login-button` |
| Index | Start button | `start-button` |
| CPF | CPF input | `cpf-input` |
| CPF | Continue button | `continue-button` |
| Scan | Product list item | `product-list-item` |
| Scan | Confirm button | `confirm-product-button` |
| Meios de Pagamento | Payment option | `payment-option` |

## 🐛 Debug

### Executar teste específico

```bash
npx playwright test payment-token-flow.spec.ts
```

### Executar com debug

```bash
npx playwright test --debug
```

### Ver trace de execução

Após executar os testes, você pode visualizar o trace:

```bash
npx playwright show-trace trace.zip
```

## 📸 Artifacts

Em caso de falha, o Playwright gera automaticamente:
- **Screenshots**: Captura do estado da página no momento da falha
- **Vídeos**: Gravação completa do teste (apenas em falhas)
- **Traces**: Timeline interativa da execução

Esses arquivos ficam disponíveis no relatório HTML.

## 🔄 CI/CD

Os testes E2E são executados automaticamente no GitHub Actions:
- Triggers: Push/PR nas branches `main`, `master`, `develop`
- Executa após os testes unitários passarem
- Upload de artifacts (screenshots, vídeos) em caso de falha

Ver `.github/workflows/ci.yml` para configuração completa.

## 📝 Adicionando Novos Testes

1. Crie um novo arquivo `.spec.ts` em `e2e/`
2. Importe os dados de teste de `fixtures/test-data.ts`
3. Use `data-testid` para selecionar elementos
4. Adicione logs descritivos com `console.log`
5. Documente o cenário neste README

## ⚠️ Troubleshooting

### Timeout em chamadas de API
- Os testes estão configurados com timeout de 90s
- Chamadas de API podem demorar até 30s (RLIINFO, RLIFUND, RLIDEAL)
- Se ocorrerem timeouts, verifique o ambiente UAT

### Elementos não encontrados
- Verifique se os `data-testid` estão corretos
- Use `npx playwright codegen` para gerar seletores automaticamente

### Navegador não abre
- Execute `npx playwright install` novamente
- Verifique logs de erro para dependências faltantes

## 📚 Recursos

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
