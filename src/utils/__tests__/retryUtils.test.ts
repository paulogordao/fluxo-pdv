import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry, makeRetryable } from '../retryUtils';

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should succeed on second attempt after one failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Server error'))
      .mockResolvedValue('success');
    
    const result = await withRetry(fn, { initialDelay: 10 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should succeed on third attempt after two failures', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Server error'))
      .mockRejectedValueOnce(new Error('Server error'))
      .mockResolvedValue('success');
    
    const result = await withRetry(fn, { maxAttempts: 3, initialDelay: 10 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw error after all attempts exhausted', async () => {
    const error = new Error('Persistent error');
    const fn = vi.fn().mockRejectedValue(error);
    
    await expect(withRetry(fn, { maxAttempts: 3, initialDelay: 10 })).rejects.toThrow('Persistent error');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should apply exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValue('success');
    
    const startTime = Date.now();
    await withRetry(fn, { 
      maxAttempts: 3, 
      initialDelay: 100,
      backoffMultiplier: 2 
    });
    const endTime = Date.now();
    
    // First retry: 100ms, Second retry: 200ms = 300ms total minimum
    expect(endTime - startTime).toBeGreaterThanOrEqual(300);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect maxDelay', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValue('success');
    
    const startTime = Date.now();
    await withRetry(fn, { 
      maxAttempts: 3, 
      initialDelay: 1000,
      maxDelay: 100,
      backoffMultiplier: 2 
    });
    const endTime = Date.now();
    
    // Both retries should be capped at 100ms = 200ms total
    expect(endTime - startTime).toBeLessThan(500);
  });

  it('should not retry AbortError', async () => {
    const error = new Error('Request aborted');
    error.name = 'AbortError';
    const fn = vi.fn().mockRejectedValue(error);
    
    await expect(withRetry(fn, { maxAttempts: 3 })).rejects.toThrow('Request aborted');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not retry TIMEOUT errors', async () => {
    const error = new Error('Request TIMEOUT');
    const fn = vi.fn().mockRejectedValue(error);
    
    await expect(withRetry(fn, { maxAttempts: 3 })).rejects.toThrow('Request TIMEOUT');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry 500 server errors', async () => {
    const error: any = new Error('Server error');
    error.status = 500;
    const fn = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');
    
    const result = await withRetry(fn, { initialDelay: 10 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry 429 rate limit errors', async () => {
    const error: any = new Error('Rate limit');
    error.status = 429;
    const fn = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');
    
    const result = await withRetry(fn, { initialDelay: 10 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry 4xx client errors (except 429)', async () => {
    const error: any = new Error('Bad request');
    error.status = 400;
    const fn = vi.fn().mockRejectedValue(error);
    
    await expect(withRetry(fn, { maxAttempts: 3 })).rejects.toThrow('Bad request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should call onRetry callback', async () => {
    const onRetry = vi.fn();
    const error = new Error('Server error');
    const fn = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');
    
    await withRetry(fn, { initialDelay: 10, onRetry });
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, error);
  });

  it('should use custom shouldRetry function', async () => {
    const shouldRetry = vi.fn().mockReturnValue(false);
    const error = new Error('Custom error');
    const fn = vi.fn().mockRejectedValue(error);
    
    await expect(withRetry(fn, { shouldRetry })).rejects.toThrow('Custom error');
    expect(shouldRetry).toHaveBeenCalledWith(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('makeRetryable', () => {
  it('should create retryable function', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const retryableFn = makeRetryable(fn);
    
    const result = await retryableFn();
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments correctly', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const retryableFn = makeRetryable(fn);
    
    await retryableFn('arg1', 'arg2', 123);
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should apply retry options', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Error'))
      .mockResolvedValue('success');
    
    const retryableFn = makeRetryable(fn, { maxAttempts: 3, initialDelay: 10 });
    const result = await retryableFn();
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry with custom options', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Error'))
      .mockResolvedValue('success');
    
    const retryableFn = makeRetryable(fn, { onRetry, initialDelay: 10 });
    await retryableFn();
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
