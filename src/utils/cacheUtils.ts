// Utility functions for managing user session cache
import { createLogger } from './logger';

const log = createLogger('cacheUtils');

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
    
    log.info("User session cache cleared successfully");
  } catch (error) {
    log.error("Error clearing user session cache:", error);
  }
};

/**
 * Checks if user session cache exists
 */
export const hasUserSessionCache = (): boolean => {
  try {
    return localStorage.getItem("user_session_cache") !== null;
  } catch (error) {
    log.error("Error checking user session cache:", error);
    return false;
  }
};

/**
 * Generates a random payment type (1 or 2)
 */
export const generateRandomPaymentType = (): number => {
  return Math.random() < 0.5 ? 1 : 2;
};

/**
 * Generates a random BIN string with 6 or 9 digits
 */
export const generateRandomBin = (): string => {
  const length = Math.random() < 0.5 ? 6 : 9;
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
};

/**
 * Clears RLIFUND cache (both request and response)
 */
export const clearRlifundCache = (): void => {
  try {
    localStorage.removeItem("rlifundRequest");
    localStorage.removeItem("rlifundResponse");
    log.info("RLIFUND cache cleared successfully");
  } catch (error) {
    log.error("Error clearing RLIFUND cache:", error);
  }
};

/**
 * Gets stored RLIFUND request
 */
export const getRlifundRequest = (): any | null => {
  try {
    const data = localStorage.getItem("rlifundRequest");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    log.error("Error getting RLIFUND request:", error);
    return null;
  }
};

/**
 * Stores cart data cache
 */
export const setCartCache = (cart: any[], totalAmount: number): void => {
  try {
    const cartCache = {
      cart,
      totalAmount,
      timestamp: Date.now()
    };
    localStorage.setItem("cartCache", JSON.stringify(cartCache));
    log.info("Cart cache stored:", cartCache);
  } catch (error) {
    log.error("Error storing cart cache:", error);
  }
};

/**
 * Gets stored cart cache
 */
export const getCartCache = (): { cart: any[], totalAmount: number, timestamp: number } | null => {
  try {
    const data = localStorage.getItem("cartCache");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    log.error("Error getting cart cache:", error);
    return null;
  }
};

/**
 * Clears cart cache
 */
export const clearCartCache = (): void => {
  try {
    localStorage.removeItem("cartCache");
    log.info("Cart cache cleared");
  } catch (error) {
    log.error("Error clearing cart cache:", error);
  }
};