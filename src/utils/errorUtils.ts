// Utility function to extract specific error messages from various error formats

export const extractErrorMessage = (error: unknown): string => {
  console.log('[extractErrorMessage] Input error:', error);
  console.log('[extractErrorMessage] Error type:', typeof error);
  console.log('[extractErrorMessage] Is Error instance:', error instanceof Error);
  
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;
    console.log('[extractErrorMessage] Error message:', message);
    
    // Try to parse nested JSON in error message like "400 - "{\"detail\":\"...\"}"
    const jsonMatch = message.match(/\{.*\}/);
    console.log('[extractErrorMessage] JSON match:', jsonMatch);
    
    if (jsonMatch) {
      try {
        // Handle escaped quotes in the JSON string
        const cleanedJson = jsonMatch[0].replace(/\\"/g, '"');
        console.log('[extractErrorMessage] Cleaned JSON:', cleanedJson);
        
        const parsedJson = JSON.parse(cleanedJson);
        console.log('[extractErrorMessage] Parsed JSON:', parsedJson);
        
        if (parsedJson.detail) {
          console.log('[extractErrorMessage] Found detail:', parsedJson.detail);
          return parsedJson.detail;
        } else if (parsedJson.message) {
          console.log('[extractErrorMessage] Found message:', parsedJson.message);
          return parsedJson.message;
        }
      } catch (parseError) {
        console.error('[extractErrorMessage] JSON parse error:', parseError);
        // Continue with original message if parsing fails
      }
    }
    
    return message;
  }

  // Handle object errors with nested structure
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    console.log('[extractErrorMessage] Object error:', errorObj);
    
    // Handle array format like [{"request": ..., "error": {...}}]
    if (Array.isArray(errorObj) && errorObj[0]?.error?.message) {
      console.log('[extractErrorMessage] Array format detected');
      return extractErrorMessage(errorObj[0].error);
    }
    
    // Handle direct properties
    if (errorObj.detail) {
      console.log('[extractErrorMessage] Direct detail found:', errorObj.detail);
      return errorObj.detail;
    }
    if (errorObj.message) {
      console.log('[extractErrorMessage] Direct message found:', errorObj.message);
      return errorObj.message;
    }
    if (errorObj.error && typeof errorObj.error === 'string') {
      console.log('[extractErrorMessage] Direct error string found:', errorObj.error);
      return errorObj.error;
    }
  }

  // Fallback for unknown error types
  console.log('[extractErrorMessage] Using fallback message');
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