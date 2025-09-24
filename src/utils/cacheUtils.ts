// Utility functions for managing user session cache

/**
 * Clears all user session cache from localStorage and sessionStorage
 * This forces the useUserSession hook to fetch fresh data from the API
 */
export const clearUserSessionCache = (): void => {
  try {
    // Remove main cache from localStorage
    localStorage.removeItem("user_session_cache");
    
    // Remove fallback data from sessionStorage
    sessionStorage.removeItem("user_name");
    sessionStorage.removeItem("company_name");
    
    console.log("[cacheUtils] User session cache cleared successfully");
  } catch (error) {
    console.error("[cacheUtils] Error clearing user session cache:", error);
  }
};

/**
 * Checks if user session cache exists
 */
export const hasUserSessionCache = (): boolean => {
  try {
    return localStorage.getItem("user_session_cache") !== null;
  } catch (error) {
    console.error("[cacheUtils] Error checking user session cache:", error);
    return false;
  }
};