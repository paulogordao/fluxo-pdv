// Utility function to extract specific error messages from various error formats

export const extractErrorMessage = (error: unknown): string => {
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;
    console.log('[DEBUG] Processing error message:', message);
    
    // Handle "STATUS_CODE - JSON_STRING" pattern like "400 - "{\"detail\":\"...\"}"
    const statusJsonMatch = message.match(/^\d+\s*-\s*"(.+)"$/);
    if (statusJsonMatch) {
      try {
        console.log('[DEBUG] Matched status-json pattern, captured:', statusJsonMatch[1]);
        
        // The captured group has the JSON with escaped quotes - need double unescaping
        let jsonString = statusJsonMatch[1];
        
        // First level: unescape the outer quotes
        jsonString = jsonString.replace(/\\"/g, '"');
        console.log('[DEBUG] After first unescape:', jsonString);
        
        // Second level: if it's still escaped JSON, parse and re-stringify to clean it
        if (jsonString.startsWith('\\')) {
          jsonString = JSON.parse('"' + jsonString + '"');
          console.log('[DEBUG] After second unescape:', jsonString);
        }
        
        const parsedJson = JSON.parse(jsonString);
        console.log('[DEBUG] Parsed JSON:', parsedJson);
        
        if (parsedJson.detail) {
          console.log('[DEBUG] Returning detail:', parsedJson.detail);
          return parsedJson.detail;
        } else if (parsedJson.message) {
          console.log('[DEBUG] Returning message:', parsedJson.message);
          return parsedJson.message;
        }
      } catch (parseError) {
        console.log('[DEBUG] Parse error:', parseError);
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