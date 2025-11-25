# Arquitetura do Sistema - Documentação Técnica

## Visão Geral

Este documento descreve a arquitetura refatorada do sistema após as melhorias implementadas nas Fases 1-4, incluindo:
- ✅ Sistema centralizado de logging
- ✅ Validações robustas com Zod
- ✅ Retry logic com exponential backoff
- ✅ Mensagens de erro contextuais
- ✅ Otimização de performance com memoização

---

## 1. Sistema de Logging

### Arquitetura

O sistema de logging é centralizado através do utilitário `createLogger` que substitui todos os `console.log` diretos.

**Localização:** `src/utils/logger.ts`

### Níveis de Log

```typescript
- debug: Informações detalhadas para debugging
- info: Eventos importantes de operação
- warn: Situações anormais mas recuperáveis
- error: Erros que requerem atenção
```

### Configuração

Controlado via variáveis de ambiente:

```bash
# .env
VITE_ENABLE_LOGS=true          # Habilita/desabilita logs
VITE_LOG_LEVEL=debug           # Nível mínimo (debug|info|warn|error)
```

**Comportamento:**
- ✅ Logs desabilitados em produção por padrão
- ✅ Prefixo `[ModuleName]` para identificação
- ✅ Timestamps opcionais em desenvolvimento
- ✅ Color-coding para melhor visibilidade

### Uso

```typescript
import { createLogger } from '@/utils/logger';

const log = createLogger('ComponentName');

// Exemplos
log.debug('Dados detalhados:', data);          // Debugging
log.info('Operação concluída');                // Info operacional
log.warn('Situação anormal:', warning);        // Avisos
log.error('Erro crítico:', error);             // Erros
```

### Arquivos Migrados

**Total:** ~2900 console.log migrados em 46+ arquivos

**Categorias:**
- Services (3): comandoService, transacaoService, authService
- Hooks (9+): useTransacoes, usePaymentOptions, useRliwaitPolling
- Utils (3): cacheUtils, errorUtils, userUtils
- Context (1): PdvContext
- Pages (27+): CpfScreen, TelefoneScreen, ScanScreen, etc
- Components (3+): ErrorModal, TechnicalDocumentation, etc

---

## 2. Sistema de Validação

### Arquitetura

Validações robustas usando **Zod** para garantir integridade de dados em todo o sistema.

**Localização:** `src/schemas/validationSchemas.ts`

### Schemas Disponíveis

```typescript
// CPF com validação de checksum
cpfSchema: z.string().length(11).refine(validateChecksum)

// Telefone com validação de DDD
telefoneSchema: z.string().min(10).max(11).refine(validateDDD)

// Transaction ID
transactionIdSchema: z.string().min(1).max(100)

// Valores monetários
paymentAmountSchema: z.number().positive().max(999999.99)

// Data de nascimento (DDMMYYYY)
birthDateSchema: z.string().length(8).refine(validateDate)

// Token/OTP
tokenSchema: z.string().min(4).max(20)

// Email
emailSchema: z.string().email().max(255)

// CNPJ com validação de checksum
cnpjSchema: z.string().length(14).refine(validateChecksum)

// Código de barras EAN
eanSchema: z.string().regex(/^\d{8}$|^\d{13}$/)
```

### Helper Function

```typescript
import { validateInput } from '@/schemas/validationSchemas';

const result = validateInput(cpfSchema, userInput);

if (result.success) {
  // result.data contém o dado validado
  console.log('CPF válido:', result.data);
} else {
  // result.error contém a mensagem de erro
  console.error('Erro:', result.error);
}
```

### Integração nos Services

```typescript
// comandoService.ts
async enviarComando(cpf: string) {
  const validation = validateInput(cpfSchema, cpf);
  if (!validation.success) {
    throw new Error(`CPF inválido: ${validation.error}`);
  }
  // Usar validation.data (garantido como válido)
}
```

### Benefícios

- ✅ Validação consistente em toda a aplicação
- ✅ Mensagens de erro claras e acionáveis
- ✅ Type-safety com TypeScript
- ✅ Redução de bugs de validação

---

## 3. Retry Logic com Exponential Backoff

### Arquitetura

Sistema de retry automático para requisições falhadas com estratégia de exponential backoff.

**Localização:** `src/utils/retryUtils.ts`

### Configuração Padrão

```typescript
{
  maxAttempts: 3,              // Máximo 3 tentativas
  initialDelay: 1000,          // Início com 1 segundo
  maxDelay: 10000,             // Máximo de 10 segundos
  backoffMultiplier: 2,        // Dobra a cada tentativa
  shouldRetry: (error) => {...} // Lógica de retry
}
```

### Estratégia de Retry

```typescript
// Tenta apenas erros recuperáveis:
✅ 5xx Server Errors
✅ 429 Rate Limit
✅ Network Errors

// NÃO tenta:
❌ 4xx Client Errors (exceto 429)
❌ Timeouts (AbortError)
❌ Erros de validação
```

### Uso Direto

```typescript
import { withRetry } from '@/utils/retryUtils';

const result = await withRetry(
  async () => {
    return await fetch('/api/endpoint');
  },
  {
    maxAttempts: 3,
    onRetry: (attempt, error) => {
      console.log(`Tentativa ${attempt} falhou:`, error);
    }
  }
);
```

### Integração em Services

```typescript
// comandoService.ts - executeComandoRequest
async function executeComandoRequest(requestBody, comando, options) {
  const makeRequest = async () => {
    // Lógica de requisição...
  };
  
  // Retry habilitado por padrão
  if (options?.enableRetry !== false) {
    return withRetry(makeRequest, {
      maxAttempts: 3,
      initialDelay: 1000,
      onRetry: (attempt, error) => {
        log.warn(`[${comando}] Retry attempt ${attempt}`, error);
      }
    });
  }
  
  return makeRequest();
}
```

### React Query Integration

```typescript
// useTransacoes.ts
export const useTransacoes = () => {
  return useQuery({
    queryKey: ['transacoes'],
    queryFn: transacaoService.buscarTransacoes,
    retry: 3,
    retryDelay: (attemptIndex) => 
      Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });
};
```

### Delays por Tentativa

```
Tentativa 1: Falha imediata
Tentativa 2: Aguarda 1 segundo  (1000ms)
Tentativa 3: Aguarda 2 segundos (2000ms)
Tentativa 4: Aguarda 4 segundos (4000ms)
...
Max delay: 10 segundos
```

---

## 4. Sistema de Erros Contextuais

### Arquitetura

Mensagens de erro aprimoradas com contexto e sugestões acionáveis.

**Localização:** `src/utils/errorUtils.ts`

### Estrutura de Erro Aprimorado

```typescript
interface EnhancedError {
  message: string;              // Mensagem técnica
  context?: {
    operation?: string;         // Operação que falhou
    suggestion?: string;        // Sugestão de solução
    userMessage?: string;       // Mensagem amigável
  };
  originalError?: unknown;      // Erro original
}
```

### Categorias de Erro

```typescript
// Network errors
getUserFriendlyError(error) => {
  message: 'Erro de conexão',
  suggestion: 'Verifique sua conexão com a internet',
  userMessage: 'Não foi possível conectar ao servidor'
}

// Timeout errors
getUserFriendlyError(error) => {
  message: 'Tempo de resposta excedido',
  suggestion: 'Tente novamente em alguns instantes',
  userMessage: 'Operação demorou muito tempo'
}

// Authentication errors
getUserFriendlyError(error) => {
  message: 'Sessão expirada',
  suggestion: 'Faça login novamente',
  userMessage: 'Sua sessão expirou'
}

// Validation errors
getUserFriendlyError(error) => {
  message: 'Dados inválidos',
  suggestion: 'Verifique os dados informados',
  userMessage: 'Os dados fornecidos são inválidos'
}

// Server errors
getUserFriendlyError(error) => {
  message: 'Erro no servidor',
  suggestion: 'Tente novamente ou contate o suporte',
  userMessage: 'Ocorreu um erro no servidor'
}
```

### Uso em Hooks

```typescript
// usePaymentOptions.ts
try {
  const data = await fetchData();
} catch (error) {
  log.error("Error fetching payment options:", error);
  
  const enhancedError = getUserFriendlyError(
    error, 
    'Carregar opções de pagamento'
  );
  
  toast.error(
    enhancedError.context?.userMessage || "Erro ao carregar",
    { description: enhancedError.context?.suggestion }
  );
}
```

### Benefícios

- ✅ Mensagens claras para usuários
- ✅ Sugestões acionáveis
- ✅ Contexto operacional
- ✅ Melhor UX em situações de erro

---

## 5. Otimização de Performance

### Memoização com React Hooks

#### useMemo

Memoriza valores computados para evitar recálculos desnecessários.

```typescript
// usePaymentOptions.ts
const result = useMemo(() => ({
  paymentOptions,
  paymentOptionsLoading,
  refetch: fetchPaymentOptions
}), [paymentOptions, paymentOptionsLoading, fetchPaymentOptions]);
```

**Quando usar:**
- Cálculos custosos
- Transformações de dados complexas
- Valores derivados de estado

#### useCallback

Memoriza funções para evitar re-criação em cada render.

```typescript
// usePaymentOptions.ts
const fetchPaymentOptions = useCallback(async () => {
  // Lógica de fetch...
}, [navigate]); // Apenas recria se navigate mudar
```

**Quando usar:**
- Funções passadas como props
- Dependências de useEffect
- Handlers de eventos complexos

### React Query Optimization

```typescript
export const useTransacoes = () => {
  return useQuery({
    queryKey: ['transacoes'],
    queryFn: transacaoService.buscarTransacoes,
    staleTime: 5 * 60 * 1000,  // Cache por 5 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
```

**Benefícios:**
- ✅ Cache automático de requisições
- ✅ Revalidação inteligente
- ✅ Redução de chamadas à API
- ✅ Melhor performance geral

### Padrão de Otimização

```typescript
// ❌ ANTES (re-render desnecessário)
const MyComponent = () => {
  const data = fetchData();
  const processed = processData(data); // Recalcula a cada render
  
  return <Child onEvent={() => handleEvent()} />; // Nova função a cada render
};

// ✅ DEPOIS (otimizado)
const MyComponent = () => {
  const data = fetchData();
  const processed = useMemo(() => processData(data), [data]);
  
  const handleEvent = useCallback(() => {
    // handler logic
  }, [dependencies]);
  
  return <Child onEvent={handleEvent} />;
};
```

---

## 6. Estrutura de Pastas

```
src/
├── config/
│   └── api.ts                    # Configurações de API
├── schemas/
│   └── validationSchemas.ts     # Schemas Zod de validação
├── utils/
│   ├── logger.ts                # Sistema de logging
│   ├── retryUtils.ts            # Retry logic
│   ├── errorUtils.ts            # Error handling
│   ├── userUtils.ts             # User utilities
│   ├── cacheUtils.ts            # Cache utilities
│   ├── cpfUtils.ts              # CPF utilities
│   ├── cnpjUtils.ts             # CNPJ utilities
│   └── dateUtils.ts             # Date utilities
├── services/
│   ├── comandoService.ts        # API commands (refatorado)
│   ├── transacaoService.ts      # Transaction service
│   ├── authService.ts           # Authentication
│   └── ...
├── hooks/
│   ├── useTransacoes.ts         # Transactions hook (otimizado)
│   ├── usePaymentOptions.ts     # Payment options (otimizado)
│   ├── useUserPermissions.ts    # User permissions
│   └── ...
├── context/
│   └── PdvContext.tsx           # POS context (refatorado)
├── pages/
│   ├── CpfScreen.tsx
│   ├── TelefoneScreen.tsx
│   └── ...
└── components/
    ├── ui/
    └── ...
```

---

## 7. Padrões de Código

### Service Pattern

```typescript
// comandoService.ts
export const comandoService = {
  async enviarComando(cpf: string) {
    // 1. Validar entrada
    const validation = validateInput(cpfSchema, cpf);
    if (!validation.success) {
      throw new Error(`Erro de validação: ${validation.error}`);
    }
    
    // 2. Preparar request
    const requestBody = { cpf: validation.data };
    
    // 3. Executar com retry automático
    return executeComandoRequest(requestBody, 'COMANDO');
  }
};
```

### Hook Pattern

```typescript
// useCustomHook.ts
export const useCustomHook = () => {
  const [state, setState] = useState(initialState);
  
  // Memoize callbacks
  const fetchData = useCallback(async () => {
    try {
      // Validação
      const validation = validateInput(schema, input);
      if (!validation.success) {
        throw new Error(validation.error);
      }
      
      // Fetch com retry
      const data = await service.fetch(validation.data);
      setState(data);
    } catch (error) {
      log.error('Erro:', error);
      const enhanced = getUserFriendlyError(error);
      toast.error(enhanced.context?.userMessage);
    }
  }, [dependencies]);
  
  // Memoize return value
  return useMemo(() => ({
    state,
    fetchData
  }), [state, fetchData]);
};
```

### Component Pattern

```typescript
// Component.tsx
const Component = () => {
  const log = createLogger('Component');
  const { data, isLoading, error } = useCustomHook();
  
  // Memoize expensive computations
  const processedData = useMemo(() => {
    return data?.map(/* transformation */);
  }, [data]);
  
  // Memoize callbacks
  const handleSubmit = useCallback(async (input) => {
    try {
      // Validar
      const validation = validateInput(schema, input);
      if (!validation.success) {
        toast.error(validation.error);
        return;
      }
      
      // Submit
      await service.submit(validation.data);
      toast.success('Sucesso!');
    } catch (error) {
      log.error('Erro ao submeter:', error);
      const enhanced = getUserFriendlyError(error, 'Submit');
      toast.error(enhanced.context?.userMessage);
    }
  }, [dependencies]);
  
  return <UI data={processedData} onSubmit={handleSubmit} />;
};
```

---

## 8. Checklist de Desenvolvimento

### Ao criar um novo Service

- [ ] Adicionar validações com Zod
- [ ] Usar `executeComandoRequest` para retry automático
- [ ] Implementar logging com `createLogger`
- [ ] Tratar erros com `getUserFriendlyError`
- [ ] Documentar parâmetros e retorno

### Ao criar um novo Hook

- [ ] Usar `useCallback` para funções
- [ ] Usar `useMemo` para valores computados
- [ ] Implementar logging
- [ ] Validar inputs
- [ ] Tratar erros contextualmente

### Ao criar um novo Component

- [ ] Criar logger com `createLogger`
- [ ] Memoizar callbacks e valores
- [ ] Validar inputs de usuário
- [ ] Mostrar erros amigáveis
- [ ] Otimizar re-renders

---

## 9. Variáveis de Ambiente

```bash
# Logging
VITE_ENABLE_LOGS=true          # Habilita logs (false em produção)
VITE_LOG_LEVEL=debug           # debug|info|warn|error

# API
VITE_API_BASE_URL=             # URL base da API
VITE_API_KEY=                  # API key (use secrets)
```

---

## 10. Métricas de Refatoração

### Redução de Código
- **comandoService.ts:** 1246 → 549 linhas (-697 linhas, -56%)
- **PdvContext.tsx:** Removido 26 linhas de mock data
- **getUserId:** Unificado de 2 arquivos para 1

### Migração de Logs
- **Total:** ~2900 console.log → createLogger
- **Arquivos:** 46+ arquivos migrados
- **Cobertura:** Services, Hooks, Utils, Context, Pages, Components

### Novas Features
- ✅ 10 schemas de validação Zod
- ✅ Sistema de retry com exponential backoff
- ✅ 5 categorias de erro contextual
- ✅ Memoização em hooks críticos

---

## 11. Roadmap Futuro

### Próximos Passos

1. **Testes Unitários**
   - Schemas de validação
   - Retry logic
   - Error handling
   - Hooks otimizados

2. **Monitoramento**
   - Dashboard de métricas
   - Tracking de erros
   - Performance metrics
   - Retry statistics

3. **Documentação**
   - Exemplos práticos
   - Guia de contribuição
   - API reference
   - Best practices

---

## 12. Referências

- [Zod Documentation](https://zod.dev/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Error Handling Best Practices](https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript)

---

**Última atualização:** 2025-11-25  
**Versão:** 1.0.0
