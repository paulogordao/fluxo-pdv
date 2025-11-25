import { z } from 'zod';

// ========== CPF Validation ==========
export const cpfSchema = z
  .string()
  .trim()
  .length(11, { message: 'CPF deve ter 11 dígitos' })
  .regex(/^\d{11}$/, { message: 'CPF deve conter apenas números' })
  .refine((cpf) => {
    // Validate CPF checksum
    if (cpf.split('').every(c => c === cpf[0])) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  }, { message: 'CPF inválido' });

// ========== Phone Validation ==========
export const telefoneSchema = z
  .string()
  .trim()
  .min(10, { message: 'Telefone deve ter no mínimo 10 dígitos' })
  .max(11, { message: 'Telefone deve ter no máximo 11 dígitos' })
  .regex(/^\d+$/, { message: 'Telefone deve conter apenas números' })
  .refine((phone) => {
    // DDD validation (11-99)
    const ddd = parseInt(phone.substring(0, 2));
    return ddd >= 11 && ddd <= 99;
  }, { message: 'DDD inválido' });

// ========== Transaction ID Validation ==========
export const transactionIdSchema = z
  .string()
  .trim()
  .min(1, { message: 'Transaction ID é obrigatório' })
  .max(100, { message: 'Transaction ID muito longo' });

// ========== Payment Amount Validation ==========
export const paymentAmountSchema = z
  .number()
  .positive({ message: 'Valor deve ser positivo' })
  .finite({ message: 'Valor deve ser finito' })
  .max(999999.99, { message: 'Valor muito alto' });

// ========== Date of Birth Validation (DDMMYYYY) ==========
export const birthDateSchema = z
  .string()
  .trim()
  .length(8, { message: 'Data de nascimento deve ter 8 dígitos (DDMMAAAA)' })
  .regex(/^\d{8}$/, { message: 'Data deve conter apenas números' })
  .refine((date) => {
    const day = parseInt(date.substring(0, 2));
    const month = parseInt(date.substring(2, 4));
    const year = parseInt(date.substring(4, 8));
    
    // Basic validation
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    // Validate actual date
    const testDate = new Date(year, month - 1, day);
    return testDate.getDate() === day && 
           testDate.getMonth() === month - 1 && 
           testDate.getFullYear() === year;
  }, { message: 'Data de nascimento inválida' })
  .refine((date) => {
    const year = parseInt(date.substring(4, 8));
    const age = new Date().getFullYear() - year;
    return age >= 18 && age <= 120;
  }, { message: 'Idade deve estar entre 18 e 120 anos' });

// ========== Token/OTP Validation ==========
export const tokenSchema = z
  .string()
  .trim()
  .min(4, { message: 'Token deve ter no mínimo 4 caracteres' })
  .max(20, { message: 'Token deve ter no máximo 20 caracteres' });

// ========== Email Validation ==========
export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Email inválido' })
  .max(255, { message: 'Email muito longo' });

// ========== CNPJ Validation ==========
export const cnpjSchema = z
  .string()
  .trim()
  .length(14, { message: 'CNPJ deve ter 14 dígitos' })
  .regex(/^\d{14}$/, { message: 'CNPJ deve conter apenas números' })
  .refine((cnpj) => {
    // Validate CNPJ checksum
    if (cnpj.split('').every(c => c === cnpj[0])) return false;
    
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) return false;
    
    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(1))) return false;
    
    return true;
  }, { message: 'CNPJ inválido' });

// ========== EAN/Barcode Validation ==========
export const eanSchema = z
  .string()
  .trim()
  .regex(/^\d{8}$|^\d{13}$/, { message: 'Código de barras deve ter 8 (EAN-8) ou 13 (EAN-13) dígitos' });

// ========== Helper function to validate with Zod ==========
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const firstError = result.error.errors[0];
    return { 
      success: false, 
      error: firstError.message 
    };
  }
}
