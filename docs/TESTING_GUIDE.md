# Guia de Testes

## Visão Geral

Este projeto utiliza **Vitest** como framework de testes, oferecendo uma experiência moderna e rápida para testes unitários em TypeScript/React.

## 📋 Índice

- [Configuração](#configuração)
- [Executando Testes](#executando-testes)
- [Estrutura de Testes](#estrutura-de-testes)
- [Schemas de Validação](#schemas-de-validação)
- [Retry Logic](#retry-logic)
- [Error Handling](#error-handling)
- [Hooks React](#hooks-react)
- [Boas Práticas](#boas-práticas)
- [Mocks e Stubs](#mocks-e-stubs)

---

## Configuração

### Dependências

```json
{
  "vitest": "^latest",
  "@vitest/ui": "^latest",
  "@testing-library/react": "^latest",
  "@testing-library/jest-dom": "^latest",
  "jsdom": "^latest"
}
```

### Arquivos de Configuração

**vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**src/test/setup.ts**
- Configura `@testing-library/jest-dom` matchers
- Cleanup automático após cada teste
- Mocks de `localStorage` e `sessionStorage`

---

## Executando Testes

### Scripts Disponíveis

```bash
# Executar todos os testes
npm run test

# Modo watch (re-executa ao salvar)
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage

# Interface visual (navegador)
npm run test:ui
```

### Executar Testes Específicos

```bash
# Arquivo específico
npm run test validationSchemas.test.ts

# Por padrão de nome
npm run test -- --grep="cpfSchema"

# Modo debug
npm run test -- --inspect-brk
```

---

## Estrutura de Testes

```
src/
├── schemas/
│   ├── __tests__/
│   │   └── validationSchemas.test.ts   (~70 testes)
│   └── validationSchemas.ts
├── utils/
│   ├── __tests__/
│   │   ├── retryUtils.test.ts          (~16 testes)
│   │   └── errorUtils.test.ts          (~21 testes)
│   └── ...
├── hooks/
│   ├── __tests__/
│   │   └── usePaymentOptions.test.ts   (~10 testes)
│   └── ...
└── test/
    └── setup.ts
```

**Total: ~117 casos de teste**

---

## Schemas de Validação

### Arquivo: `src/schemas/__tests__/validationSchemas.test.ts`

#### CPF Schema (~15 testes)

```typescript
describe('cpfSchema', () => {
  it('should validate valid CPF', () => {
    const result = cpfSchema.safeParse('12345678909');
    expect(result.success).toBe(true);
  });

  it('should reject CPF with all same digits', () => {
    const result = cpfSchema.safeParse('11111111111');
    expect(result.success).toBe(false);
  });

  it('should reject CPF with invalid checksum', () => {
    const result = cpfSchema.safeParse('12345678900');
    expect(result.success).toBe(false);
  });
});
```

**Casos testados:**
- ✅ CPFs válidos conhecidos
- ❌ CPFs com dígitos repetidos
- ❌ Checksum incorreto
- ❌ Formato inválido (letras, tamanho errado)

#### Telefone Schema (~8 testes)

```typescript
describe('telefoneSchema', () => {
  it('should validate valid mobile phone (11 digits)', () => {
    const result = telefoneSchema.safeParse('11987654321');
    expect(result.success).toBe(true);
  });

  it('should reject phone with invalid DDD', () => {
    const result = telefoneSchema.safeParse('01987654321');
    expect(result.success).toBe(false);
  });
});
```

**Casos testados:**
- ✅ Telefones móveis (11 dígitos)
- ✅ Telefones fixos (10 dígitos)
- ❌ DDDs inválidos (01-10)
- ❌ Formatos incorretos

#### Birth Date Schema (~10 testes)

```typescript
describe('birthDateSchema', () => {
  it('should validate valid birth date', () => {
    const result = birthDateSchema.safeParse('01011990');
    expect(result.success).toBe(true);
  });

  it('should reject date with person too young', () => {
    const currentYear = new Date().getFullYear();
    const tooYoung = `0101${currentYear - 10}`;
    expect(birthDateSchema.safeParse(tooYoung).success).toBe(false);
  });
});
```

**Casos testados:**
- ✅ Datas válidas (DDMMAAAA)
- ❌ Datas inválidas (31/02, 00/00)
- ❌ Idade < 18 anos
- ❌ Idade > 120 anos

#### Outros Schemas

- **cnpjSchema**: 10 testes (válido, dígitos repetidos, checksum)
- **eanSchema**: 4 testes (EAN-8, EAN-13)
- **emailSchema**: 5 testes (formato, comprimento)
- **tokenSchema**: 3 testes (comprimento)
- **transactionIdSchema**: 3 testes (comprimento)
- **paymentAmountSchema**: 5 testes (valores positivos, limites)

#### Validate Input Helper (~5 testes)

```typescript
describe('validateInput', () => {
  it('should return success for valid input', () => {
    const result = validateInput(cpfSchema, '12345678909');
    expect(result.success).toBe(true);
  });

  it('should return error for invalid input', () => {
    const result = validateInput(cpfSchema, '11111111111');
    expect(result.success).toBe(false);
  });
});
```

---

## Retry Logic

### Arquivo: `src/utils/__tests__/retryUtils.test.ts`

#### withRetry Function (~12 testes)

```typescript
describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should succeed on second attempt after one failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Server error'))
      .mockResolvedValue('success');
    
    const result = await withRetry(fn, { initialDelay: 10 });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should apply exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValue('success');
    
    const startTime = Date.now();
    await withRetry(fn, { 
      initialDelay: 100,
      backoffMultiplier: 2 
    });
    const endTime = Date.now();
    
    // First retry: 100ms, Second retry: 200ms
    expect(endTime - startTime).toBeGreaterThanOrEqual(300);
  });
});
```

**Casos testados:**
- ✅ Sucesso na primeira tentativa
- ✅ Sucesso após 1, 2, 3 falhas
- ❌ Falha após todas as tentativas
- ⏱️ Exponential backoff correto
- 🚫 Não retenta AbortError/TIMEOUT
- 🔄 Retenta erros 5xx e 429
- ❌ Não retenta erros 4xx (exceto 429)
- 🎯 Callbacks `shouldRetry` e `onRetry`

#### makeRetryable Function (~4 testes)

```typescript
describe('makeRetryable', () => {
  it('should pass arguments correctly', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const retryableFn = makeRetryable(fn);
    
    await retryableFn('arg1', 'arg2', 123);
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });
});
```

---

## Error Handling

### Arquivo: `src/utils/__tests__/errorUtils.test.ts`

#### extractErrorMessage (~15 testes)

```typescript
describe('extractErrorMessage', () => {
  it('should extract message from Error object', () => {
    const error = new Error('Test error message');
    expect(extractErrorMessage(error)).toBe('Test error message');
  });

  it('should parse STATUS_CODE - JSON_STRING pattern', () => {
    const error = '500 - {"message":"Server error"}';
    expect(extractErrorMessage(error)).toContain('Server error');
  });

  it('should extract context userMessage when present', () => {
    const error = { context: { userMessage: 'User-friendly' } };
    expect(extractErrorMessage(error)).toBe('User-friendly');
  });
});
```

**Casos testados:**
- Error objects com `message`
- Objetos com `detail`, `error`, `message`
- Padrão "STATUS_CODE - JSON_STRING"
- JSON aninhado
- Context com `userMessage`
- Fallback para erros desconhecidos

#### getUserFriendlyError (~10 testes)

```typescript
describe('getUserFriendlyError', () => {
  it('should format network error', () => {
    const error = new Error('Failed to fetch');
    const result = getUserFriendlyError(error, 'Carregar dados');
    
    expect(result.context?.userMessage).toContain('conectar');
    expect(result.context?.suggestion).toContain('conexão');
  });

  it('should format authentication error', () => {
    const error: any = new Error('Unauthorized');
    error.status = 401;
    const result = getUserFriendlyError(error);
    
    expect(result.context?.userMessage).toContain('Sessão expirou');
  });
});
```

**Casos testados:**
- 🌐 Erros de rede (Failed to fetch)
- ⏱️ Erros de timeout
- 🔒 Erros de autenticação (401)
- ✅ Erros de validação
- 💥 Erros de servidor (500, 429, 403)

#### formatHealthCheckError (~6 testes)

```typescript
describe('formatHealthCheckError', () => {
  it('should format health check with errors array', () => {
    const error = {
      errors: [
        { message: 'Database connection failed' }
      ]
    };
    expect(formatHealthCheckError(error)).toContain('Database');
  });
});
```

---

## Hooks React

### Arquivo: `src/hooks/__tests__/usePaymentOptions.test.ts`

```typescript
describe('usePaymentOptions', () => {
  const mockNavigate = vi.fn();
  const mockConsultarFluxo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  it('should load payment options with valid CPF', async () => {
    const validCpf = '12345678909';
    const mockData = { options: ['PIX', 'CARD'] };
    
    localStorage.setItem('cpfDigitado', validCpf);
    mockConsultarFluxo.mockResolvedValue(mockData);

    const { result } = renderHook(() => usePaymentOptions());

    await waitFor(() => {
      expect(result.current.paymentOptionsLoading).toBe(false);
    });

    expect(result.current.paymentOptions).toEqual(mockData);
  });

  it('should redirect when CPF is invalid', async () => {
    localStorage.setItem('cpfDigitado', '11111111111');
    renderHook(() => usePaymentOptions());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cpf');
    });
  });
});
```

**Casos testados:**
- ✅ Carregar opções com CPF válido
- 🔄 Redirecionar quando CPF não encontrado
- ✅ Validar CPF antes de request
- ❌ Tratar erros com mensagens amigáveis
- 🔄 Função `refetch` funciona
- ⏳ Estados de loading corretos
- 🧠 Memoização previne re-renders

---

## Boas Práticas

### 1. Organize os Testes por Contexto

```typescript
describe('ComponentName', () => {
  describe('when user is logged in', () => {
    it('should display user profile', () => {
      // test
    });
  });

  describe('when user is not logged in', () => {
    it('should redirect to login', () => {
      // test
    });
  });
});
```

### 2. Use Nomes Descritivos

```typescript
// ❌ Bad
it('test 1', () => {});

// ✅ Good
it('should validate CPF and reject when all digits are the same', () => {});
```

### 3. Teste Casos de Sucesso e Falha

```typescript
describe('paymentAmountSchema', () => {
  it('should accept valid amounts', () => {
    expect(paymentAmountSchema.safeParse(100).success).toBe(true);
  });

  it('should reject zero amount', () => {
    expect(paymentAmountSchema.safeParse(0).success).toBe(false);
  });

  it('should reject negative amount', () => {
    expect(paymentAmountSchema.safeParse(-10).success).toBe(false);
  });
});
```

### 4. Limpe Estado Entre Testes

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
```

### 5. Use Mocks Estrategicamente

```typescript
// Mock apenas o necessário
vi.mock('@/services/api', () => ({
  fetchData: vi.fn(),
}));

// Evite mockar tudo
// ❌ vi.mock('@/utils/allUtils');
```

---

## Mocks e Stubs

### Mock de Serviços

```typescript
vi.mock('@/services/consultaFluxoService', () => ({
  consultaFluxoService: {
    consultarFluxo: vi.fn(),
  },
}));
```

### Mock de React Router

```typescript
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

const mockNavigate = vi.fn();
(useNavigate as any).mockReturnValue(mockNavigate);
```

### Mock de Toast

```typescript
vi.mock('@/components/ui/sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));
```

### Spy em Funções

```typescript
const fn = vi.fn().mockResolvedValue('success');

// Verificar chamadas
expect(fn).toHaveBeenCalledTimes(1);
expect(fn).toHaveBeenCalledWith('arg1', 'arg2');

// Mock de retornos diferentes
fn.mockResolvedValueOnce('first')
  .mockResolvedValueOnce('second')
  .mockResolvedValue('default');
```

### Wait Helper Customizado

```typescript
const waitFor = async (callback: () => void, options?: { timeout?: number }) => {
  const timeout = options?.timeout ?? 3000;
  const interval = 50;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  callback(); // Final attempt
};
```

---

## Métricas de Cobertura

### Objetivos

- **Linha (Line)**: > 80%
- **Branch**: > 75%
- **Função**: > 80%
- **Statement**: > 80%

### Visualizar Relatório

```bash
npm run test:coverage
```

Relatório HTML gerado em: `coverage/index.html`

---

## Troubleshooting

### Testes Lentos

```typescript
// Use delays menores em testes
await withRetry(fn, { initialDelay: 10, maxAttempts: 2 });
```

### Mocks Não Funcionam

```typescript
// Certifique-se de que o mock está antes do import
vi.mock('@/services/api');
import { useApi } from '@/hooks/useApi';
```

### Timeouts

```typescript
// Aumente o timeout para testes assíncronos
it('should complete async operation', async () => {
  // test
}, 10000); // 10 segundos
```

---

## Recursos Adicionais

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Zod Testing](https://zod.dev/)

---

## Próximos Passos

- [ ] Adicionar testes de integração
- [ ] Testes E2E com Playwright
- [ ] CI/CD com testes automáticos
- [ ] Snapshot testing para componentes UI
- [ ] Testes de performance
