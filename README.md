# Sistema PDV - Point of Sale

Sistema de Ponto de Venda (PDV) desenvolvido com React, TypeScript e Tailwind CSS, com arquitetura refatorada para máxima performance, confiabilidade e manutenibilidade.

## 📚 Documentação Técnica

### 🏗️ Arquitetura
- **[Arquitetura do Sistema](docs/ARCHITECTURE.md)** - Visão geral completa da arquitetura frontend
- **[Arquitetura do Backend](docs/BACKEND_ARCHITECTURE.md)** - N8N, FastAPI e fluxos de integração
- **[Schema do Banco de Dados](docs/DATABASE_SCHEMA.md)** - Estrutura completa das tabelas (Supabase/PostgreSQL)

### 🔌 API & Integrações
- **[Endpoints da API](docs/API_ENDPOINTS.md)** - Documentação completa dos endpoints

### 📖 Guias de Desenvolvimento
- **[Guia de Validação](docs/VALIDATION_GUIDE.md)** - Como usar validações com Zod
- **[Guia de Retry Logic](docs/RETRY_GUIDE.md)** - Sistema de tentativas automáticas
- **[Guia de Testes](docs/TESTING_GUIDE.md)** - Testes unitários com Vitest

## 🚀 Tecnologias

- **React 18** - UI Library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first styling
- **Zod** - Schema validation
- **React Query** - Data fetching & caching
- **React Router** - Client-side routing
- **Shadcn/ui** - UI components

## ✨ Funcionalidades Principais

### 🔍 Sistema de Logging Centralizado
- ✅ Logger unificado com `createLogger`
- ✅ Níveis configuráveis (debug, info, warn, error)
- ✅ Desabilitado em produção por padrão
- ✅ ~2900 logs migrados em 46+ arquivos

### ✅ Validações Robustas com Zod
- ✅ 10 schemas de validação (CPF, telefone, email, CNPJ, etc)
- ✅ Validação de checksum para CPF/CNPJ
- ✅ Mensagens de erro claras e acionáveis
- ✅ Type-safe com TypeScript

### 🔄 Retry Logic com Exponential Backoff
- ✅ Tentativas automáticas em falhas temporárias
- ✅ 3 tentativas por padrão
- ✅ Retry apenas em erros recuperáveis (5xx, 429, network)
- ✅ Integrado em services e React Query

### 💬 Mensagens de Erro Contextuais
- ✅ Sugestões acionáveis para o usuário
- ✅ Mensagens amigáveis e claras
- ✅ Contexto operacional detalhado
- ✅ 5 categorias de erro

### ⚡ Otimização de Performance
- ✅ Memoização estratégica com useMemo/useCallback
- ✅ Cache inteligente com React Query
- ✅ Redução de re-renders desnecessários
- ✅ Código refatorado: -56% em comandoService.ts

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações (API, etc)
├── schemas/         # Schemas de validação (Zod)
├── utils/           # Utilitários (logger, retry, errors)
├── services/        # Services da API
├── hooks/           # Custom React hooks
├── context/         # React contexts
├── pages/           # Páginas da aplicação
├── components/      # Componentes reutilizáveis
│   └── ui/          # Componentes UI base (shadcn)
└── types/           # TypeScript type definitions
```

## 🔧 Setup & Desenvolvimento

### Variáveis de Ambiente

```bash
# .env
VITE_ENABLE_LOGS=true          # Habilita logs (false em produção)
VITE_LOG_LEVEL=debug           # Nível mínimo: debug|info|warn|error
VITE_API_BASE_URL=             # URL base da API
```

### Instalação e Execução

```sh
# Clonar o repositório
git clone <YOUR_GIT_URL>

# Navegar para o diretório
cd <YOUR_PROJECT_NAME>

# Instalar dependências
npm install

# Desenvolvimento (com hot reload)
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview
```

## 📖 Exemplos de Uso

### Sistema de Logging

```typescript
import { createLogger } from '@/utils/logger';

const log = createLogger('ComponentName');

log.debug('Dados detalhados:', data);     // Debugging
log.info('Operação concluída');           // Info
log.warn('Situação anormal');             // Warning
log.error('Erro crítico:', error);        // Error
```

### Validação de Dados

```typescript
import { validateInput, cpfSchema } from '@/schemas/validationSchemas';

const result = validateInput(cpfSchema, '12345678901');

if (result.success) {
  console.log('CPF válido:', result.data);
} else {
  console.error('Erro de validação:', result.error);
}
```

### Retry Logic

```typescript
import { withRetry } from '@/utils/retryUtils';

const data = await withRetry(
  async () => {
    return await fetch('/api/endpoint').then(r => r.json());
  },
  {
    maxAttempts: 3,
    onRetry: (attempt, error) => {
      console.log(`Tentativa ${attempt}:`, error);
    }
  }
);
```

### Error Handling Contextual

```typescript
import { getUserFriendlyError } from '@/utils/errorUtils';
import { toast } from '@/components/ui/sonner';

try {
  await performOperation();
} catch (error) {
  const enhanced = getUserFriendlyError(error, 'Carregar dados');
  toast.error(
    enhanced.context?.userMessage || 'Erro ao processar',
    { description: enhanced.context?.suggestion }
  );
}
```

## 📊 Métricas de Refatoração

### Redução de Código
- **comandoService.ts:** 1246 → 549 linhas (-697 linhas, **-56%**)
- **PdvContext.tsx:** Removido 26 linhas de mock data hardcoded
- **getUserId:** Unificado de 2 implementações duplicadas para 1

### Migração de Logging
- **Total:** ~2900 `console.log` migrados para sistema centralizado
- **Arquivos:** 46+ arquivos (services, hooks, utils, context, pages, components)
- **Cobertura:** 100% dos arquivos principais

### Novas Funcionalidades
- ✅ 10 schemas de validação Zod
- ✅ Sistema de retry com exponential backoff
- ✅ 5 categorias de erro contextual com sugestões
- ✅ Memoização estratégica em hooks críticos

## 🧪 Testing

### Executar Testes

```bash
# Rodar todos os testes
npm test

# Modo watch (re-executa ao salvar)
npm run test:watch

# Relatório de cobertura
npm run test:coverage

# Interface visual no navegador
npm run test:ui
```

### Cobertura de Testes

- **~117 casos de teste** implementados
- **Schemas de validação**: 70+ testes (CPF, telefone, email, CNPJ, EAN, etc.)
- **Retry logic**: 16 testes (exponential backoff, error handling, callbacks)
- **Error handling**: 21 testes (network, timeout, authentication, validation)
- **Hooks otimizados**: 10 testes (usePaymentOptions com memoização)

**Documentação completa:** [Guia de Testes](docs/TESTING_GUIDE.md)

## 🎭 Testes E2E (Playwright)

### Pré-requisitos

Instalar os navegadores do Playwright (apenas na primeira vez):

```bash
npx playwright install
```

### Executar Testes E2E

```bash
# Executar todos os testes E2E
npx playwright test

# Executar com interface visual interativa (recomendado para debug)
npx playwright test --ui

# Executar com navegador visível
npx playwright test --headed

# Ver relatório HTML após execução
npx playwright show-report
```

### Cenários de Teste Implementados

#### Fluxo de Pagamento com Token - Versão 2 Online

**Cenário 1: Rejeição de Token Inválido** ✅
- Login com usuário de teste UAT V2
- Navegação: Index → CPF → Scan → Meios de Pagamento
- Seleção de "Pagar com APP"
- Inserção de token inválido: `182101`
- Verificação de modal de erro

**Cenário 2: Cancelamento Durante Entrada de Token** ✅
- Navegação até tela de token
- Inserção de token parcial
- Clique em "Cancelar"
- Verificação de retorno para tela de meios de pagamento

**Documentação completa:** [E2E Tests Guide](e2e/README.md)

## 🚀 CI/CD Pipeline

### GitHub Actions

O projeto possui um pipeline automatizado que executa em cada commit e pull request:

#### Workflow Stages

```
┌─────────────┐
│   Commit    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Test Job (Node 18.x & 20.x)   │
│  ├─ Install Dependencies        │
│  ├─ Run Linter                  │
│  ├─ Execute Unit Tests          │
│  ├─ Generate Coverage           │
│  └─ Upload Artifacts            │
└──────────┬──────────────────────┘
           │
           ▼
    ┌─────────────┐
    │  Build Job  │
    │  ├─ Build   │
    │  └─ Archive │
    └──────┬──────┘
           │
           ▼
    ┌─────────────────────┐
    │  E2E Tests Job      │
    │  ├─ Playwright      │
    │  ├─ Payment Flow    │
    │  └─ Artifacts       │
    └─────────────────────┘
```

#### O que é testado automaticamente?

- ✅ **Testes Unitários**: Todos os ~117 casos de teste
- ✅ **Testes E2E**: Fluxos críticos com Playwright
- ✅ **Cobertura de Código**: Relatório completo gerado
- ✅ **Linting**: Validação de code style
- ✅ **Build de Produção**: Verifica se o build funciona
- ✅ **Compatibilidade**: Node.js 18.x e 20.x

#### Artifacts

- 📊 **Coverage Reports**: Mantidos por 30 dias
- 📦 **Build Artifacts**: Mantidos por 7 dias
- 🎭 **Playwright Reports**: Screenshots e vídeos em caso de falha

**Ver status:** [GitHub Actions](../../actions)

## 🎨 Code Patterns

### Service Pattern
```typescript
export const myService = {
  async method(input: string) {
    // 1. Validar entrada
    const validation = validateInput(schema, input);
    if (!validation.success) {
      throw new Error(validation.error);
    }
    
    // 2. Executar com retry automático
    return executeRequest(validation.data);
  }
};
```

### Hook Pattern
```typescript
export const useCustomHook = () => {
  // Memoizar callbacks
  const fetchData = useCallback(async () => {
    // Validação + Fetch + Error handling
  }, [dependencies]);
  
  // Memoizar retorno
  return useMemo(() => ({
    data,
    fetchData
  }), [data, fetchData]);
};
```

## 🤝 Contribuindo

1. Siga os padrões documentados em [ARCHITECTURE.md](docs/ARCHITECTURE.md)
2. Use validações Zod para todos os inputs de usuário
3. Implemente logging apropriado com `createLogger`
4. Trate erros com `getUserFriendlyError` para UX melhor
5. Otimize com memoização quando necessário

---

## 📝 Lovable Project Info

**URL**: https://lovable.dev/projects/545ea482-2dbc-4f74-a44d-ef766724ae4e

### Como editar este projeto?

**Use Lovable (Recomendado)**

Visite o [Lovable Project](https://lovable.dev/projects/545ea482-2dbc-4f74-a44d-ef766724ae4e) e comece a fazer prompts. Mudanças serão commitadas automaticamente.

**Use sua IDE preferida**

Clone este repo e faça push das mudanças. Mudanças via push também serão refletidas no Lovable.

**Edite diretamente no GitHub**

- Navegue até o arquivo desejado
- Clique no botão "Edit" (ícone de lápis)
- Faça suas mudanças e commit

**Use GitHub Codespaces**

- Clique no botão "Code" (verde)
- Selecione a aba "Codespaces"
- Clique em "New codespace"

### Como fazer deploy?

Abra [Lovable](https://lovable.dev/projects/545ea482-2dbc-4f74-a44d-ef766724ae4e) e clique em **Share → Publish**.

### Custom Domain

Sim! Navegue até **Project > Settings > Domains** e clique em **Connect Domain**.

Leia mais: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

**Última atualização:** 2025-11-25  
**Versão:** 1.0.0
