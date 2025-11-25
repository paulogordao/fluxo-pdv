import { createLogger } from './logger';

const log = createLogger('retryUtils');

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors or 5xx server errors
    if (error.name === 'AbortError') return false; // Don't retry timeouts
    if (error.message?.includes('TIMEOUT')) return false;
    
    const status = error.status || error.response?.status;
    if (status) {
      // Don't retry 4xx client errors (except 429 rate limit)
      if (status >= 400 && status < 500 && status !== 429) return false;
      // Retry 5xx server errors and 429 rate limit
      return status >= 500 || status === 429;
    }
    
    // Retry on network errors
    return true;
  }
};

/**
 * Execute an async function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      log.debug(`Attempt ${attempt}/${opts.maxAttempts}`);
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        log.debug('Error not retryable, throwing immediately');
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === opts.maxAttempts) {
        log.warn(`All ${opts.maxAttempts} attempts failed`);
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      );
      
      log.debug(`Attempt ${attempt} failed, retrying in ${delay}ms`, error);
      
      // Call onRetry callback if provided
      if (options.onRetry) {
        options.onRetry(attempt, error);
      }
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a retryable version of a function
 */
export function makeRetryable<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    return withRetry(() => fn(...args), options);
  };
}
