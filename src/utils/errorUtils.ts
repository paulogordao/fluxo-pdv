// Utility function to extract specific error messages from various error formats
import { createLogger } from './logger';

const log = createLogger('errorUtils');

/**
 * Error context to provide more actionable error messages
 */
interface ErrorContext {
  operation?: string;
  suggestion?: string;
  userMessage?: string;
}

/**
 * Enhanced error message with context
 */
export interface EnhancedError {
  message: string;
  context?: ErrorContext;
  originalError?: unknown;
}

/**
 * Extract error message with context
 */
export const extractErrorMessage = (error: unknown, context?: ErrorContext): string => {
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;
    log.debug('Processing error message:', message);
    
    // Handle "STATUS_CODE - JSON_STRING" pattern like "400 - "{\"detail\":\"...\"}"
    const statusJsonMatch = message.match(/^\d+\s*-\s*"(.+)"$/);
    if (statusJsonMatch) {
      try {
        log.debug('Matched status-json pattern, captured:', statusJsonMatch[1]);
        
        // The captured group has the JSON with escaped quotes - need double unescaping
        let jsonString = statusJsonMatch[1];
        
        // First level: unescape the outer quotes
        jsonString = jsonString.replace(/\\"/g, '"');
        log.debug('After first unescape:', jsonString);
        
        // Second level: if it's still escaped JSON, parse and re-stringify to clean it
        if (jsonString.startsWith('\\')) {
          jsonString = JSON.parse('"' + jsonString + '"');
          log.debug('After second unescape:', jsonString);
        }
        
        const parsedJson = JSON.parse(jsonString);
        log.debug('Parsed JSON:', parsedJson);
        
        if (parsedJson.detail) {
          log.debug('Returning detail:', parsedJson.detail);
          return parsedJson.detail;
        } else if (parsedJson.message) {
          log.debug('Returning message:', parsedJson.message);
          return parsedJson.message;
        }
      } catch (parseError) {
        log.debug('Parse error:', parseError);
        // Continue with fallback parsing
      }
    }
    
    // Try to parse nested JSON in error message like "{\"detail\":\"...\"}"
    const jsonMatch = message.match(/\{[^}]*\}/);
    if (jsonMatch) {
      try {
        // Handle escaped quotes in the JSON string
        const cleanedJson = jsonMatch[0].replace(/\\"/g, '"');
        const parsedJson = JSON.parse(cleanedJson);
        
        if (parsedJson.detail) {
          return parsedJson.detail;
        } else if (parsedJson.message) {
          return parsedJson.message;
        }
      } catch (parseError) {
        // Continue with original message if parsing fails
      }
    }
    
    return message;
  }

  // Handle object errors with nested structure
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    
    // Handle direct properties
    if (errorObj.detail) {
      return errorObj.detail;
    }
    if (errorObj.message) {
      return errorObj.message;
    }
    if (errorObj.error && typeof errorObj.error === 'string') {
      return errorObj.error;
    }
  }

  // Fallback for unknown error types
  const baseMessage = 'Ocorreu um erro inesperado';
  
  if (context?.userMessage) {
    return `${baseMessage}: ${context.userMessage}`;
  }
  
  return baseMessage;
};

/**
 * Get user-friendly error message with suggestions
 */
export const getUserFriendlyError = (error: unknown, operation?: string): EnhancedError => {
  const baseMessage = extractErrorMessage(error);
  
  // Network errors
  if (baseMessage.includes('Failed to fetch') || baseMessage.includes('Network')) {
    return {
      message: 'Erro de conexão',
      context: {
        operation,
        suggestion: 'Verifique sua conexão com a internet e tente novamente',
        userMessage: 'Não foi possível conectar ao servidor'
      },
      originalError: error
    };
  }
  
  // Timeout errors
  if (baseMessage.includes('TIMEOUT') || baseMessage.includes('timeout')) {
    return {
      message: 'Tempo de resposta excedido',
      context: {
        operation,
        suggestion: 'O servidor demorou muito para responder. Tente novamente em alguns instantes',
        userMessage: 'Operação demorou muito tempo'
      },
      originalError: error
    };
  }
  
  // Authentication errors
  if (baseMessage.includes('401') || baseMessage.includes('Unauthorized')) {
    return {
      message: 'Sessão expirada',
      context: {
        operation,
        suggestion: 'Faça login novamente para continuar',
        userMessage: 'Sua sessão expirou'
      },
      originalError: error
    };
  }
  
  // Validation errors
  if (baseMessage.includes('inválid') || baseMessage.includes('validation')) {
    return {
      message: 'Dados inválidos',
      context: {
        operation,
        suggestion: 'Verifique os dados informados e tente novamente',
        userMessage: 'Os dados fornecidos são inválidos'
      },
      originalError: error
    };
  }
  
  // Server errors
  if (baseMessage.includes('500') || baseMessage.includes('Internal Server Error')) {
    return {
      message: 'Erro no servidor',
      context: {
        operation,
        suggestion: 'Tente novamente em alguns instantes. Se o erro persistir, entre em contato com o suporte',
        userMessage: 'Ocorreu um erro no servidor'
      },
      originalError: error
    };
  }
  
  // Default enhanced error
  return {
    message: baseMessage,
    context: {
      operation,
      suggestion: 'Tente novamente. Se o erro persistir, entre em contato com o suporte'
    },
    originalError: error
  };
};

export const formatHealthCheckError = (healthError: any): string => {
  if (healthError?.response?.errors && Array.isArray(healthError.response.errors)) {
    return healthError.response.errors[0]?.message || 'Erro no health check';
  }
  
  if (healthError?.error) {
    return extractErrorMessage(healthError.error);
  }
  
  if (healthError?.message) {
    return healthError.message;
  }

  return 'Health check falhou';
};