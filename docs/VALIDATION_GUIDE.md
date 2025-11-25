# Guia de Validação - Sistema Zod

## Introdução

Este guia descreve como usar o sistema de validação baseado em Zod implementado no projeto.

---

## Schemas Disponíveis

### 1. CPF Validation

```typescript
import { cpfSchema, validateInput } from '@/schemas/validationSchemas';

// Validar CPF
const result = validateInput(cpfSchema, '12345678901');

if (result.success) {
  console.log('CPF válido:', result.data);
} else {
  console.error('Erro:', result.error);
}
```

**Validações:**
- ✅ 11 dígitos obrigatórios
- ✅ Apenas números
- ✅ Checksum válido
- ✅ Rejeita sequências repetidas (11111111111)

**Mensagens de erro:**
- "CPF deve ter 11 dígitos"
- "CPF deve conter apenas números"
- "CPF inválido"

---

### 2. Telefone Validation

```typescript
import { telefoneSchema, validateInput } from '@/schemas/validationSchemas';

// Validar telefone (10 ou 11 dígitos)
const result = validateInput(telefoneSchema, '11987654321');

if (result.success) {
  console.log('Telefone válido:', result.data);
}
```

**Validações:**
- ✅ Mínimo 10 dígitos (fixo)
- ✅ Máximo 11 dígitos (celular)
- ✅ Apenas números
- ✅ DDD válido (11-99)

**Mensagens de erro:**
- "Telefone deve ter no mínimo 10 dígitos"
- "Telefone deve ter no máximo 11 dígitos"
- "Telefone deve conter apenas números"
- "DDD inválido"

---

### 3. Transaction ID Validation

```typescript
import { transactionIdSchema, validateInput } from '@/schemas/validationSchemas';

const result = validateInput(transactionIdSchema, txId);

if (!result.success) {
  throw new Error(`Transaction ID inválido: ${result.error}`);
}
```

**Validações:**
- ✅ Não vazio
- ✅ Máximo 100 caracteres

---

### 4. Payment Amount Validation

```typescript
import { paymentAmountSchema, validateInput } from '@/schemas/validationSchemas';

const result = validateInput(paymentAmountSchema, 150.50);

if (result.success) {
  console.log('Valor válido:', result.data);
}
```

**Validações:**
- ✅ Número positivo
- ✅ Finito
- ✅ Máximo R$ 999.999,99

**Mensagens de erro:**
- "Valor deve ser positivo"
- "Valor deve ser finito"
- "Valor muito alto"

---

### 5. Data de Nascimento (DDMMYYYY)

```typescript
import { birthDateSchema, validateInput } from '@/schemas/validationSchemas';

// Formato: DDMMYYYY
const result = validateInput(birthDateSchema, '15081995');

if (result.success) {
  console.log('Data válida:', result.data);
}
```

**Validações:**
- ✅ 8 dígitos (DDMMYYYY)
- ✅ Apenas números
- ✅ Data válida no calendário
- ✅ Idade entre 18 e 120 anos

**Mensagens de erro:**
- "Data de nascimento deve ter 8 dígitos (DDMMAAAA)"
- "Data deve conter apenas números"
- "Data de nascimento inválida"
- "Idade deve estar entre 18 e 120 anos"

---

### 6. Token/OTP Validation

```typescript
import { tokenSchema, validateInput } from '@/schemas/validationSchemas';

const result = validateInput(tokenSchema, '123456');

if (result.success) {
  console.log('Token válido:', result.data);
}
```

**Validações:**
- ✅ Mínimo 4 caracteres
- ✅ Máximo 20 caracteres

---

### 7. Email Validation

```typescript
import { emailSchema, validateInput } from '@/schemas/validationSchemas';

const result = validateInput(emailSchema, 'user@example.com');

if (result.success) {
  console.log('Email válido:', result.data);
}
```

**Validações:**
- ✅ Formato de email válido
- ✅ Máximo 255 caracteres

---

### 8. CNPJ Validation

```typescript
import { cnpjSchema, validateInput } from '@/schemas/validationSchemas';

const result = validateInput(cnpjSchema, '12345678000195');

if (result.success) {
  console.log('CNPJ válido:', result.data);
}
```

**Validações:**
- ✅ 14 dígitos obrigatórios
- ✅ Apenas números
- ✅ Checksum válido
- ✅ Rejeita sequências repetidas

---

### 9. Código de Barras (EAN)

```typescript
import { eanSchema, validateInput } from '@/schemas/validationSchemas';

// EAN-8 ou EAN-13
const result = validateInput(eanSchema, '7891234567890');

if (result.success) {
  console.log('EAN válido:', result.data);
}
```

**Validações:**
- ✅ 8 dígitos (EAN-8) ou 13 dígitos (EAN-13)

---

## Uso em Services

### Exemplo: comandoService.ts

```typescript
import { validateInput, cpfSchema, telefoneSchema, transactionIdSchema } from '@/schemas/validationSchemas';

export const comandoService = {
  async enviarComando(cpf: string) {
    // Validar CPF
    const validation = validateInput(cpfSchema, cpf);
    if (!validation.success) {
      throw new Error(`CPF inválido: ${validation.error}`);
    }
    
    // Usar dado validado
    const requestBody = {
      cpf: validation.data
    };
    
    return await executeRequest(requestBody);
  },
  
  async enviarComandoRlicell(telefone: string, transactionId: string) {
    // Validar telefone
    const phoneValidation = validateInput(telefoneSchema, telefone);
    if (!phoneValidation.success) {
      throw new Error(`Telefone inválido: ${phoneValidation.error}`);
    }
    
    // Validar transaction ID
    const txValidation = validateInput(transactionIdSchema, transactionId);
    if (!txValidation.success) {
      throw new Error(`Transaction ID inválido: ${txValidation.error}`);
    }
    
    const requestBody = {
      telefone: phoneValidation.data,
      id_transaction: txValidation.data
    };
    
    return await executeRequest(requestBody);
  }
};
```

---

## Uso em Hooks

### Exemplo: usePaymentOptions.ts

```typescript
import { useCallback } from 'react';
import { validateInput, cpfSchema } from '@/schemas/validationSchemas';
import { getUserFriendlyError } from '@/utils/errorUtils';
import { toast } from '@/components/ui/sonner';

export const usePaymentOptions = () => {
  const fetchPaymentOptions = useCallback(async () => {
    try {
      const cpf = localStorage.getItem('cpfDigitado');
      
      if (!cpf) {
        toast.error("CPF não encontrado");
        return;
      }
      
      // Validar CPF
      const validation = validateInput(cpfSchema, cpf);
      if (!validation.success) {
        toast.error(validation.error);
        return;
      }
      
      // Usar CPF validado
      const data = await service.fetch(validation.data);
      setData(data);
    } catch (error) {
      const enhanced = getUserFriendlyError(error, 'Carregar opções');
      toast.error(enhanced.context?.userMessage);
    }
  }, []);
  
  return { fetchPaymentOptions };
};
```

---

## Uso em Components

### Exemplo: Form Component

```typescript
import { useState } from 'react';
import { validateInput, cpfSchema } from '@/schemas/validationSchemas';
import { toast } from '@/components/ui/sonner';

const CpfForm = () => {
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validar CPF
    const validation = validateInput(cpfSchema, cpf);
    if (!validation.success) {
      setError(validation.error);
      toast.error(validation.error);
      return;
    }
    
    // Processar CPF válido
    try {
      await submitCpf(validation.data);
      toast.success('CPF enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar CPF');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={cpf}
        onChange={(e) => setCpf(e.target.value)}
        maxLength={11}
      />
      {error && <span className="error">{error}</span>}
      <button type="submit">Enviar</button>
    </form>
  );
};
```

---

## Validação em Tempo Real

### Exemplo: Input com Validação Dinâmica

```typescript
import { useState, useEffect } from 'react';
import { validateInput, telefoneSchema } from '@/schemas/validationSchemas';

const TelefoneInput = () => {
  const [telefone, setTelefone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  
  useEffect(() => {
    if (telefone.length === 0) {
      setError(null);
      setIsValid(false);
      return;
    }
    
    const validation = validateInput(telefoneSchema, telefone);
    if (validation.success) {
      setError(null);
      setIsValid(true);
    } else {
      setError(validation.error);
      setIsValid(false);
    }
  }, [telefone]);
  
  return (
    <div>
      <input
        type="text"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
        className={isValid ? 'valid' : error ? 'invalid' : ''}
      />
      {error && <span className="error">{error}</span>}
      {isValid && <span className="success">✓ Telefone válido</span>}
    </div>
  );
};
```

---

## Criando Novos Schemas

### Exemplo: Schema Customizado

```typescript
// src/schemas/validationSchemas.ts

export const customSchema = z
  .string()
  .trim()
  .min(5, { message: 'Mínimo 5 caracteres' })
  .max(50, { message: 'Máximo 50 caracteres' })
  .regex(/^[A-Za-z0-9]+$/, { message: 'Apenas letras e números' })
  .refine((value) => {
    // Lógica de validação customizada
    return value !== 'forbidden';
  }, { message: 'Valor não permitido' });
```

---

## Composição de Schemas

### Exemplo: Schema de Objeto

```typescript
import { z } from 'zod';

const userSchema = z.object({
  nome: z.string().min(3).max(100),
  cpf: cpfSchema,
  email: emailSchema,
  telefone: telefoneSchema,
  dataNascimento: birthDateSchema
});

type User = z.infer<typeof userSchema>;

// Validar objeto completo
const validation = validateInput(userSchema, userData);
if (validation.success) {
  const user: User = validation.data;
  // Usar dados validados
}
```

---

## Error Handling Patterns

### Pattern 1: Early Return

```typescript
async function processData(cpf: string) {
  const validation = validateInput(cpfSchema, cpf);
  if (!validation.success) {
    toast.error(validation.error);
    return; // Early return
  }
  
  // Continuar com dado válido
  await service.process(validation.data);
}
```

### Pattern 2: Throw Error

```typescript
async function processData(cpf: string) {
  const validation = validateInput(cpfSchema, cpf);
  if (!validation.success) {
    throw new Error(`Validação falhou: ${validation.error}`);
  }
  
  return await service.process(validation.data);
}
```

### Pattern 3: Return Error Object

```typescript
async function processData(cpf: string) {
  const validation = validateInput(cpfSchema, cpf);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error
    };
  }
  
  const result = await service.process(validation.data);
  return {
    success: true,
    data: result
  };
}
```

---

## Best Practices

### ✅ DO

```typescript
// Validar antes de qualquer processamento
const validation = validateInput(schema, input);
if (!validation.success) {
  return; // Ou throw
}

// Usar dado validado
process(validation.data);
```

```typescript
// Mostrar mensagens claras ao usuário
if (!validation.success) {
  toast.error(validation.error); // Mensagem específica
}
```

```typescript
// Validar em services antes de API calls
async enviarDados(cpf: string) {
  const validation = validateInput(cpfSchema, cpf);
  if (!validation.success) {
    throw new Error(validation.error);
  }
  
  return await api.send(validation.data);
}
```

### ❌ DON'T

```typescript
// Não ignorar validação
process(input); // ❌ Pode estar inválido

// Não usar try/catch para validação
try {
  schema.parse(input); // ❌ Usa safeParse com validateInput
} catch (error) {
  // ...
}

// Não validar tarde demais
await api.send(input); // ❌ Validar ANTES do send
```

---

## Testes de Validação

### Exemplo: Testes Unitários

```typescript
import { validateInput, cpfSchema } from '@/schemas/validationSchemas';

describe('CPF Validation', () => {
  it('should accept valid CPF', () => {
    const result = validateInput(cpfSchema, '12345678901');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('12345678901');
    }
  });
  
  it('should reject invalid length', () => {
    const result = validateInput(cpfSchema, '123');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('11 dígitos');
    }
  });
  
  it('should reject non-numeric', () => {
    const result = validateInput(cpfSchema, '123abc78901');
    expect(result.success).toBe(false);
  });
  
  it('should reject invalid checksum', () => {
    const result = validateInput(cpfSchema, '12345678900');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('inválido');
    }
  });
});
```

---

## Referências

- [Zod Documentation](https://zod.dev/)
- [TypeScript Type Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

**Última atualização:** 2025-11-25
