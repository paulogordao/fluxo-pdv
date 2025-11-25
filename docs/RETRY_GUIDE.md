# Guia de Retry Logic - Sistema de Tentativas Automáticas

## Introdução

Este guia descreve o sistema de retry (tentativas automáticas) com exponential backoff implementado no projeto para lidar com falhas temporárias em requisições HTTP.

---

## Conceitos Básicos

### O que é Retry Logic?

Retry logic é uma técnica que automaticamente tenta novamente operações que falharam, assumindo que falhas temporárias (como problemas de rede) podem ser resolvidas com uma nova tentativa.

### O que é Exponential Backoff?

É uma estratégia onde o tempo de espera entre tentativas aumenta exponencialmente:
- Tentativa 1: Falha imediata
- Tentativa 2: Aguarda 1s
- Tentativa 3: Aguarda 2s
- Tentativa 4: Aguarda 4s
- Tentativa 5: Aguarda 8s
- ...

Isso evita sobrecarregar servidores com tentativas rápidas demais.

---

## Configuração Padrão

```typescript
{
  maxAttempts: 3,              // Máximo 3 tentativas
  initialDelay: 1000,          // Inicia com 1 segundo
  maxDelay: 10000,             // Máximo de 10 segundos
  backoffMultiplier: 2,        // Multiplica por 2 a cada tentativa
  shouldRetry: (error) => {...} // Lógica que decide se deve tentar novamente
}
```

---

## Quando o Sistema Tenta Novamente

### ✅ Erros Retentáveis

```typescript
// Server Errors (5xx)
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
504 Gateway Timeout

// Rate Limiting
429 Too Many Requests

// Network Errors
Failed to fetch
Network request failed
Connection timeout
```

### ❌ Erros NÃO Retentáveis

```typescript
// Client Errors (4xx) - exceto 429
400 Bad Request          // Requisição inválida
401 Unauthorized         // Não autenticado
403 Forbidden            // Sem permissão
404 Not Found            // Não encontrado
422 Unprocessable Entity // Validação falhou

// Timeout Errors
AbortError               // Request abortado por timeout
TIMEOUT                  // Timeout customizado

// Validation Errors
CPF inválido
Dados inválidos
```

---

## Uso Básico

### withRetry Function

```typescript
import { withRetry } from '@/utils/retryUtils';

// Exemplo simples
const result = await withRetry(async () => {
  const response = await fetch('/api/endpoint');
  return response.json();
});
```

### Com Configuração Customizada

```typescript
import { withRetry } from '@/utils/retryUtils';

const result = await withRetry(
  async () => {
    return await fetchData();
  },
  {
    maxAttempts: 5,           // 5 tentativas
    initialDelay: 2000,       // Começa com 2s
    maxDelay: 30000,          // Máximo 30s
    backoffMultiplier: 3,     // Multiplica por 3
    onRetry: (attempt, error) => {
      console.log(`Tentativa ${attempt} falhou:`, error);
    }
  }
);
```

### Com Lógica Customizada

```typescript
import { withRetry } from '@/utils/retryUtils';

const result = await withRetry(
  async () => {
    return await fetchData();
  },
  {
    shouldRetry: (error) => {
      // Tentar apenas erros específicos
      if (error.status === 503) return true;
      if (error.message?.includes('network')) return true;
      return false;
    }
  }
);
```

---

## Integração em Services

### comandoService.ts

```typescript
import { withRetry } from '@/utils/retryUtils';

async function executeComandoRequest(
  requestBody: any,
  comando: string,
  options?: {
    enableRetry?: boolean;
  }
): Promise<ComandoResponse> {
  const makeRequest = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { ...headers },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      
      throw error;
    }
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

---

## Integração com React Query

### useTransacoes Hook

```typescript
import { useQuery } from '@tanstack/react-query';

export const useTransacoes = () => {
  return useQuery({
    queryKey: ['transacoes'],
    queryFn: transacaoService.buscarTransacoes,
    staleTime: 5 * 60 * 1000,
    
    // Retry com exponential backoff
    retry: 3,
    retryDelay: (attemptIndex) => 
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
```

**Delays por tentativa:**
```
Tentativa 1: 1000ms  (1s)
Tentativa 2: 2000ms  (2s)
Tentativa 3: 4000ms  (4s)
Tentativa 4: 8000ms  (8s - mas limitado a 10s)
```

---

## Exemplos Práticos

### Exemplo 1: Fetch Simples

```typescript
import { withRetry } from '@/utils/retryUtils';
import { createLogger } from '@/utils/logger';

const log = createLogger('DataService');

async function fetchUserData(userId: string) {
  try {
    const data = await withRetry(
      async () => {
        log.info('Fetching user data...', userId);
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          const error: any = new Error(`HTTP ${response.status}`);
          error.status = response.status;
          throw error;
        }
        
        return response.json();
      },
      {
        onRetry: (attempt, error) => {
          log.warn(`Retry ${attempt} after error:`, error);
        }
      }
    );
    
    log.info('User data fetched successfully');
    return data;
  } catch (error) {
    log.error('Failed to fetch user data after retries:', error);
    throw error;
  }
}
```

### Exemplo 2: POST Request

```typescript
import { withRetry } from '@/utils/retryUtils';

async function submitOrder(orderData: Order) {
  return await withRetry(
    async () => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const error: any = new Error('Order submission failed');
        error.status = response.status;
        throw error;
      }
      
      return response.json();
    },
    {
      maxAttempts: 5,
      shouldRetry: (error: any) => {
        // Não tentar novamente se for erro de validação
        if (error.status >= 400 && error.status < 500) {
          return false;
        }
        return true;
      }
    }
  );
}
```

### Exemplo 3: Hook Customizado

```typescript
import { useState, useCallback } from 'react';
import { withRetry } from '@/utils/retryUtils';
import { toast } from '@/components/ui/sonner';

export const useDataFetch = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async (endpoint: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await withRetry(
        async () => {
          const response = await fetch(endpoint);
          if (!response.ok) throw new Error('Fetch failed');
          return response.json();
        },
        {
          onRetry: (attempt) => {
            toast.info(`Tentando novamente (${attempt}/3)...`);
          }
        }
      );
      
      setData(result);
      toast.success('Dados carregados com sucesso!');
    } catch (err) {
      setError(err);
      toast.error('Erro ao carregar dados após múltiplas tentativas');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return { data, isLoading, error, fetchData };
};
```

---

## Monitoramento de Retries

### Logging de Tentativas

```typescript
import { withRetry } from '@/utils/retryUtils';
import { createLogger } from '@/utils/logger';

const log = createLogger('Service');

const result = await withRetry(
  async () => {
    return await operation();
  },
  {
    onRetry: (attempt, error) => {
      log.warn(`Retry attempt ${attempt}:`, {
        error: error.message,
        status: error.status,
        timestamp: new Date().toISOString()
      });
    }
  }
);
```

### Métricas de Retry

```typescript
interface RetryMetrics {
  totalAttempts: number;
  successfulAfterRetry: boolean;
  failedPermanently: boolean;
  totalDelay: number;
}

async function fetchWithMetrics(): Promise<{ data: any; metrics: RetryMetrics }> {
  const metrics: RetryMetrics = {
    totalAttempts: 0,
    successfulAfterRetry: false,
    failedPermanently: false,
    totalDelay: 0
  };
  
  const startTime = Date.now();
  
  try {
    const data = await withRetry(
      async () => {
        metrics.totalAttempts++;
        return await fetch('/api/data');
      },
      {
        onRetry: (attempt) => {
          metrics.successfulAfterRetry = true;
        }
      }
    );
    
    metrics.totalDelay = Date.now() - startTime;
    return { data, metrics };
  } catch (error) {
    metrics.failedPermanently = true;
    metrics.totalDelay = Date.now() - startTime;
    throw error;
  }
}
```

---

## Patterns Avançados

### Pattern 1: Retry com Fallback

```typescript
async function fetchDataWithFallback() {
  try {
    // Tentar endpoint principal
    return await withRetry(async () => {
      return await fetch('/api/primary').then(r => r.json());
    });
  } catch (primaryError) {
    log.warn('Primary endpoint failed, trying fallback');
    
    // Tentar endpoint secundário
    return await withRetry(async () => {
      return await fetch('/api/fallback').then(r => r.json());
    });
  }
}
```

### Pattern 2: Retry Seletivo

```typescript
async function smartRetry(operation: () => Promise<any>) {
  return await withRetry(
    operation,
    {
      shouldRetry: (error: any) => {
        // Classificar erros
        const isNetworkError = error.message?.includes('network');
        const isServerError = error.status >= 500;
        const isRateLimit = error.status === 429;
        
        // Decidir se deve tentar novamente
        if (isNetworkError) return true;
        if (isServerError) return true;
        if (isRateLimit) return true;
        
        // Não tentar outros erros
        return false;
      }
    }
  );
}
```

### Pattern 3: Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minuto
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Se circuit está aberto, falhar rápido
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await withRetry(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private isOpen(): boolean {
    if (this.failures >= this.threshold) {
      const timeSinceLastFail = Date.now() - this.lastFailTime;
      return timeSinceLastFail < this.timeout;
    }
    return false;
  }
  
  private onSuccess(): void {
    this.failures = 0;
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();
  }
}

// Uso
const breaker = new CircuitBreaker();
const result = await breaker.execute(async () => {
  return await fetch('/api/data').then(r => r.json());
});
```

---

## Testing Retry Logic

### Exemplo de Teste

```typescript
import { withRetry } from '@/utils/retryUtils';

describe('Retry Logic', () => {
  it('should retry on failure and succeed', async () => {
    let attempts = 0;
    
    const operation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    };
    
    const result = await withRetry(operation, {
      maxAttempts: 3,
      initialDelay: 10 // Delay curto para testes
    });
    
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
  
  it('should not retry non-retryable errors', async () => {
    let attempts = 0;
    
    const operation = async () => {
      attempts++;
      const error: any = new Error('Bad request');
      error.status = 400;
      throw error;
    };
    
    await expect(
      withRetry(operation, { maxAttempts: 3 })
    ).rejects.toThrow('Bad request');
    
    expect(attempts).toBe(1); // Não deve tentar novamente
  });
});
```

---

## Best Practices

### ✅ DO

```typescript
// Usar retry para operações de rede
const data = await withRetry(() => fetch('/api/data'));

// Configurar onRetry para logging
await withRetry(operation, {
  onRetry: (attempt, error) => {
    log.warn(`Retry ${attempt}:`, error);
  }
});

// Desabilitar retry para operações idempotentes críticas
await executeRequest(data, { enableRetry: false });

// Limitar número de tentativas
await withRetry(operation, { maxAttempts: 3 });
```

### ❌ DON'T

```typescript
// Não usar retry para operações não-idempotentes sem cuidado
await withRetry(() => createPayment()); // ❌ Pode criar múltiplos pagamentos

// Não usar delay muito curto
await withRetry(operation, { initialDelay: 10 }); // ❌ Muito rápido

// Não tentar indefinidamente
await withRetry(operation, { maxAttempts: 999 }); // ❌ Muitas tentativas

// Não ignorar erros de retry
try {
  await withRetry(operation);
} catch {} // ❌ Não fazer nada com o erro
```

---

## Referências

- [Exponential Backoff Algorithm](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Idempotency in APIs](https://stripe.com/docs/api/idempotent_requests)

---

**Última atualização:** 2025-11-25
