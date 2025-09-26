// Utility function to extract specific error messages from various error formats

export const extractErrorMessage = (error: unknown): string => {
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;
    
    // Try to parse nested JSON in error message like "400 - "{\"detail\":\"...\"}"
    const jsonMatch = message.match(/\{.*\}/);
    if (jsonMatch) {
      try {
        const parsedJson = JSON.parse(jsonMatch[0].replace(/\\"/g, '"'));
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
    
    // Handle array format like [{"request": ..., "error": {...}}]
    if (Array.isArray(errorObj) && errorObj[0]?.error?.message) {
      return extractErrorMessage(errorObj[0].error);
    }
    
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
  return 'Ocorreu um erro inesperado';
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