import { describe, it, expect } from 'vitest';
import { extractErrorMessage, getUserFriendlyError, formatHealthCheckError } from '../errorUtils';

describe('extractErrorMessage', () => {
  it('should extract message from Error object', () => {
    const error = new Error('Test error message');
    const result = extractErrorMessage(error);
    expect(result).toBe('Test error message');
  });

  it('should extract message from object with message property', () => {
    const error = { message: 'Custom error message' };
    const result = extractErrorMessage(error);
    expect(result).toBe('Custom error message');
  });

  it('should extract detail from object with detail property', () => {
    const error = { detail: 'Detailed error message' };
    const result = extractErrorMessage(error);
    expect(result).toBe('Detailed error message');
  });

  it('should extract error from object with error property', () => {
    const error = { error: 'Error description' };
    const result = extractErrorMessage(error);
    expect(result).toBe('Error description');
  });

  it('should parse STATUS_CODE - JSON_STRING pattern', () => {
    const error = '500 - {"message":"Server error"}';
    const result = extractErrorMessage(error);
    expect(result).toContain('Server error');
  });

  it('should parse nested JSON with detail', () => {
    const error = { message: '{"detail":"Nested error detail"}' };
    const result = extractErrorMessage(error);
    expect(result).toContain('Nested error detail');
  });

  it('should parse nested JSON with message', () => {
    const error = { message: '{"message":"Nested error message"}' };
    const result = extractErrorMessage(error);
    expect(result).toContain('Nested error message');
  });

  it('should handle string error directly', () => {
    const error = 'Plain string error';
    const result = extractErrorMessage(error);
    expect(result).toBe('Plain string error');
  });

  it('should handle null error', () => {
    const result = extractErrorMessage(null);
    expect(result).toBe('Erro desconhecido');
  });

  it('should handle undefined error', () => {
    const result = extractErrorMessage(undefined);
    expect(result).toBe('Erro desconhecido');
  });

  it('should handle number as error', () => {
    const result = extractErrorMessage(404);
    expect(result).toBe('Erro desconhecido');
  });

  it('should extract context userMessage when present', () => {
    const error = { context: { userMessage: 'User-friendly message' } };
    const result = extractErrorMessage(error);
    expect(result).toBe('User-friendly message');
  });

  it('should prioritize context userMessage over other messages', () => {
    const error = { 
      message: 'Technical message',
      context: { userMessage: 'User-friendly message' }
    };
    const result = extractErrorMessage(error);
    expect(result).toBe('User-friendly message');
  });

  it('should handle complex nested JSON structures', () => {
    const error = { 
      message: '{"data":{"error":{"detail":"Deep nested error"}}}'
    };
    const result = extractErrorMessage(error);
    expect(result).toContain('Deep nested error');
  });
});

describe('getUserFriendlyError', () => {
  it('should format network error', () => {
    const error = new Error('Failed to fetch');
    const result = getUserFriendlyError(error, 'Carregar dados');
    
    expect(result.message).toContain('Failed to fetch');
    expect(result.context?.userMessage).toContain('Não foi possível conectar');
    expect(result.context?.suggestion).toContain('Verifique sua conexão');
    expect(result.context?.operation).toBe('Carregar dados');
  });

  it('should format timeout error', () => {
    const error = new Error('Request timeout');
    const result = getUserFriendlyError(error, 'Processar pagamento');
    
    expect(result.context?.userMessage).toContain('demorou muito');
    expect(result.context?.suggestion).toContain('Tente novamente');
  });

  it('should format authentication error (401)', () => {
    const error: any = new Error('Unauthorized');
    error.status = 401;
    const result = getUserFriendlyError(error, 'Acessar recurso');
    
    expect(result.context?.userMessage).toContain('Sessão expirou');
    expect(result.context?.suggestion).toContain('Faça login novamente');
  });

  it('should format validation error', () => {
    const error = new Error('CPF inválido');
    const result = getUserFriendlyError(error, 'Validar CPF');
    
    expect(result.context?.userMessage).toContain('inválido');
  });

  it('should format server error (500)', () => {
    const error: any = new Error('Internal server error');
    error.status = 500;
    const result = getUserFriendlyError(error);
    
    expect(result.context?.userMessage).toContain('problema no servidor');
    expect(result.context?.suggestion).toContain('Tente novamente');
  });

  it('should format generic error with operation context', () => {
    const error = new Error('Unknown error');
    const result = getUserFriendlyError(error, 'Realizar operação');
    
    expect(result.context?.operation).toBe('Realizar operação');
    expect(result.context?.userMessage).toBeDefined();
  });

  it('should handle error without status code', () => {
    const error = new Error('Generic error');
    const result = getUserFriendlyError(error);
    
    expect(result.message).toBe('Generic error');
    expect(result.context?.userMessage).toBeDefined();
  });

  it('should preserve original error', () => {
    const originalError = new Error('Original');
    const result = getUserFriendlyError(originalError);
    
    expect(result.originalError).toBe(originalError);
  });

  it('should handle rate limit error (429)', () => {
    const error: any = new Error('Too many requests');
    error.status = 429;
    const result = getUserFriendlyError(error);
    
    expect(result.context?.userMessage).toContain('limite de requisições');
  });

  it('should format forbidden error (403)', () => {
    const error: any = new Error('Forbidden');
    error.status = 403;
    const result = getUserFriendlyError(error);
    
    expect(result.context?.userMessage).toContain('não tem permissão');
  });
});

describe('formatHealthCheckError', () => {
  it('should format health check error with errors array', () => {
    const error = {
      errors: [
        { message: 'Database connection failed' },
        { message: 'Cache unavailable' }
      ]
    };
    const result = formatHealthCheckError(error);
    
    expect(result).toContain('Database connection failed');
    expect(result).toContain('Cache unavailable');
  });

  it('should format health check error with single error property', () => {
    const error = {
      error: 'Service unavailable'
    };
    const result = formatHealthCheckError(error);
    
    expect(result).toBe('Service unavailable');
  });

  it('should format health check error with message property', () => {
    const error = {
      message: 'Health check failed'
    };
    const result = formatHealthCheckError(error);
    
    expect(result).toBe('Health check failed');
  });

  it('should return default message for empty error', () => {
    const result = formatHealthCheckError({});
    expect(result).toBe('Erro na verificação de saúde do sistema');
  });

  it('should handle error with nested error structure', () => {
    const error = {
      errors: [
        { detail: 'Connection timeout' }
      ]
    };
    const result = formatHealthCheckError(error);
    
    expect(result).toContain('Connection timeout');
  });

  it('should handle null error', () => {
    const result = formatHealthCheckError(null);
    expect(result).toBe('Erro na verificação de saúde do sistema');
  });
});
