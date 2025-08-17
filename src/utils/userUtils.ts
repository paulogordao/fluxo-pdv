// Utility function to get user ID from localStorage
export const getUserId = (): string | null => {
  try {
    // First, try to get it directly
    const directUserId = localStorage.getItem('userId');
    if (directUserId) {
      console.log('[getUserId] Found userId directly:', directUserId);
      return directUserId;
    }

    // Try to get from userData object
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      if (parsedUserData?.id) {
        console.log('[getUserId] Found userId in userData:', parsedUserData.id);
        return parsedUserData.id;
      }
    }

    // Try to get from loginResponse object
    const loginResponse = localStorage.getItem('loginResponse');
    if (loginResponse) {
      const parsedLoginResponse = JSON.parse(loginResponse);
      if (parsedLoginResponse?.id) {
        console.log('[getUserId] Found userId in loginResponse:', parsedLoginResponse.id);
        return parsedLoginResponse.id;
      }
    }

    // Search through all localStorage keys for login-related data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('login') || key.includes('user') || key.includes('auth'))) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed?.id && typeof parsed.id === 'string' && parsed.id.length > 10) {
              console.log(`[getUserId] Found userId in ${key}:`, parsed.id);
              return parsed.id;
            }
          }
        } catch (e) {
          // Skip non-JSON values
        }
      }
    }

    console.warn('[getUserId] User ID not found in localStorage');
    return null;
  } catch (error) {
    console.error('[getUserId] Error retrieving user ID:', error);
    return null;
  }
};