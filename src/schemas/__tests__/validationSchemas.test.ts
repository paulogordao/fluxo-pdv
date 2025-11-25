import { describe, it, expect } from 'vitest';
import {
  cpfSchema,
  telefoneSchema,
  transactionIdSchema,
  paymentAmountSchema,
  birthDateSchema,
  tokenSchema,
  emailSchema,
  cnpjSchema,
  eanSchema,
  validateInput,
} from '../validationSchemas';

describe('cpfSchema', () => {
  it('should validate valid CPF', () => {
    const validCpfs = [
      '12345678909',
      '11144477735',
      '52599681830',
    ];

    validCpfs.forEach(cpf => {
      const result = cpfSchema.safeParse(cpf);
      expect(result.success).toBe(true);
    });
  });

  it('should reject CPF with all same digits', () => {
    const invalidCpfs = [
      '11111111111',
      '22222222222',
      '00000000000',
    ];

    invalidCpfs.forEach(cpf => {
      const result = cpfSchema.safeParse(cpf);
      expect(result.success).toBe(false);
    });
  });

  it('should reject CPF with invalid checksum', () => {
    const result = cpfSchema.safeParse('12345678900');
    expect(result.success).toBe(false);
  });

  it('should reject CPF with invalid length', () => {
    const result = cpfSchema.safeParse('123456789');
    expect(result.success).toBe(false);
  });

  it('should reject CPF with letters', () => {
    const result = cpfSchema.safeParse('1234567890a');
    expect(result.success).toBe(false);
  });

  it('should reject empty CPF', () => {
    const result = cpfSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('telefoneSchema', () => {
  it('should validate valid mobile phone (11 digits)', () => {
    const validPhones = [
      '11987654321',
      '21987654321',
      '85987654321',
    ];

    validPhones.forEach(phone => {
      const result = telefoneSchema.safeParse(phone);
      expect(result.success).toBe(true);
    });
  });

  it('should validate valid landline (10 digits)', () => {
    const validPhones = [
      '1133334444',
      '2133334444',
      '8533334444',
    ];

    validPhones.forEach(phone => {
      const result = telefoneSchema.safeParse(phone);
      expect(result.success).toBe(true);
    });
  });

  it('should reject phone with invalid DDD', () => {
    const invalidPhones = [
      '01987654321',
      '10987654321',
      '00987654321',
    ];

    invalidPhones.forEach(phone => {
      const result = telefoneSchema.safeParse(phone);
      expect(result.success).toBe(false);
    });
  });

  it('should reject phone with invalid length', () => {
    const result = telefoneSchema.safeParse('119876543');
    expect(result.success).toBe(false);
  });

  it('should reject phone with letters', () => {
    const result = telefoneSchema.safeParse('1198765432a');
    expect(result.success).toBe(false);
  });
});

describe('birthDateSchema', () => {
  it('should validate valid birth date', () => {
    const validDates = [
      '01011990',
      '15061985',
      '31121995',
    ];

    validDates.forEach(date => {
      const result = birthDateSchema.safeParse(date);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid dates', () => {
    const invalidDates = [
      '31022020', // February 31st doesn't exist
      '00012020', // Day 00 doesn't exist
      '32012020', // Day 32 doesn't exist
    ];

    invalidDates.forEach(date => {
      const result = birthDateSchema.safeParse(date);
      expect(result.success).toBe(false);
    });
  });

  it('should reject date with person too young (< 18 years)', () => {
    const currentYear = new Date().getFullYear();
    const tooYoung = `0101${currentYear - 10}`;
    const result = birthDateSchema.safeParse(tooYoung);
    expect(result.success).toBe(false);
  });

  it('should reject date with person too old (> 120 years)', () => {
    const currentYear = new Date().getFullYear();
    const tooOld = `0101${currentYear - 130}`;
    const result = birthDateSchema.safeParse(tooOld);
    expect(result.success).toBe(false);
  });

  it('should reject invalid format', () => {
    const result = birthDateSchema.safeParse('1990-01-01');
    expect(result.success).toBe(false);
  });
});

describe('cnpjSchema', () => {
  it('should validate valid CNPJ', () => {
    const validCnpjs = [
      '11222333000181',
      '11444777000161',
    ];

    validCnpjs.forEach(cnpj => {
      const result = cnpjSchema.safeParse(cnpj);
      expect(result.success).toBe(true);
    });
  });

  it('should reject CNPJ with all same digits', () => {
    const invalidCnpjs = [
      '11111111111111',
      '00000000000000',
    ];

    invalidCnpjs.forEach(cnpj => {
      const result = cnpjSchema.safeParse(cnpj);
      expect(result.success).toBe(false);
    });
  });

  it('should reject CNPJ with invalid checksum', () => {
    const result = cnpjSchema.safeParse('11222333000182');
    expect(result.success).toBe(false);
  });

  it('should reject CNPJ with invalid length', () => {
    const result = cnpjSchema.safeParse('1122233300018');
    expect(result.success).toBe(false);
  });

  it('should reject CNPJ with letters', () => {
    const result = cnpjSchema.safeParse('1122233300018a');
    expect(result.success).toBe(false);
  });
});

describe('eanSchema', () => {
  it('should validate EAN-13', () => {
    const result = eanSchema.safeParse('1234567890128');
    expect(result.success).toBe(true);
  });

  it('should validate EAN-8', () => {
    const result = eanSchema.safeParse('12345670');
    expect(result.success).toBe(true);
  });

  it('should reject invalid EAN length', () => {
    const result = eanSchema.safeParse('123456');
    expect(result.success).toBe(false);
  });

  it('should reject EAN with letters', () => {
    const result = eanSchema.safeParse('123456789012a');
    expect(result.success).toBe(false);
  });
});

describe('emailSchema', () => {
  it('should validate valid email', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.com',
    ];

    validEmails.forEach(email => {
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid email format', () => {
    const invalidEmails = [
      'invalid',
      '@example.com',
      'user@',
      'user @example.com',
    ];

    invalidEmails.forEach(email => {
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(false);
    });
  });

  it('should reject email exceeding max length', () => {
    const longEmail = 'a'.repeat(256) + '@example.com';
    const result = emailSchema.safeParse(longEmail);
    expect(result.success).toBe(false);
  });
});

describe('tokenSchema', () => {
  it('should validate valid token', () => {
    const result = tokenSchema.safeParse('123456');
    expect(result.success).toBe(true);
  });

  it('should reject token too short', () => {
    const result = tokenSchema.safeParse('12');
    expect(result.success).toBe(false);
  });

  it('should reject token too long', () => {
    const result = tokenSchema.safeParse('1'.repeat(21));
    expect(result.success).toBe(false);
  });
});

describe('transactionIdSchema', () => {
  it('should validate valid transaction ID', () => {
    const result = transactionIdSchema.safeParse('TXN12345');
    expect(result.success).toBe(true);
  });

  it('should reject transaction ID too short', () => {
    const result = transactionIdSchema.safeParse('TX');
    expect(result.success).toBe(false);
  });

  it('should reject transaction ID too long', () => {
    const result = transactionIdSchema.safeParse('T'.repeat(101));
    expect(result.success).toBe(false);
  });
});

describe('paymentAmountSchema', () => {
  it('should validate valid payment amount', () => {
    const validAmounts = [0.01, 1, 100, 999999.99];

    validAmounts.forEach(amount => {
      const result = paymentAmountSchema.safeParse(amount);
      expect(result.success).toBe(true);
    });
  });

  it('should reject zero amount', () => {
    const result = paymentAmountSchema.safeParse(0);
    expect(result.success).toBe(false);
  });

  it('should reject negative amount', () => {
    const result = paymentAmountSchema.safeParse(-10);
    expect(result.success).toBe(false);
  });

  it('should reject amount exceeding max', () => {
    const result = paymentAmountSchema.safeParse(1000001);
    expect(result.success).toBe(false);
  });

  it('should reject infinite amount', () => {
    const result = paymentAmountSchema.safeParse(Infinity);
    expect(result.success).toBe(false);
  });
});

describe('validateInput', () => {
  it('should return success for valid input', () => {
    const result = validateInput(cpfSchema, '12345678909');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('12345678909');
    }
  });

  it('should return error for invalid input', () => {
    const result = validateInput(cpfSchema, '11111111111');
    expect(result.success).toBe(false);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    }
  });

  it('should return first error message for multiple errors', () => {
    const result = validateInput(emailSchema, '');
    expect(result.success).toBe(false);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toBeDefined();
    }
  });
});
