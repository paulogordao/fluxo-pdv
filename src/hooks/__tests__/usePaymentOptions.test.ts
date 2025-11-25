import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePaymentOptions } from '../usePaymentOptions';

// Helper to wait for async updates
const waitFor = async (callback: () => void, options?: { timeout?: number; interval?: number }) => {
  const timeout = options?.timeout ?? 3000;
  const interval = options?.interval ?? 50;
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      callback();
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  callback(); // Final attempt, will throw if still failing
};
import { consultaFluxoService } from '@/services/consultaFluxoService';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('@/services/consultaFluxoService', () => ({
  consultaFluxoService: {
    consultarFluxo: vi.fn(),
  },
}));

vi.mock('@/components/ui/sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('usePaymentOptions', () => {
  const mockNavigate = vi.fn();
  const mockConsultarFluxo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (useNavigate as any).mockReturnValue(mockNavigate);
    (consultaFluxoService.consultarFluxo as any) = mockConsultarFluxo;
  });

  it('should load payment options with valid CPF', async () => {
    const validCpf = '12345678909';
    const mockData = { options: ['PIX', 'CARD'] };
    
    localStorage.setItem('cpfDigitado', validCpf);
    mockConsultarFluxo.mockResolvedValue(mockData);

    const { result } = renderHook(() => usePaymentOptions());

    // Initially loading
    expect(result.current.paymentOptionsLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.paymentOptionsLoading).toBe(false);
    });

    expect(result.current.paymentOptions).toEqual(mockData);
    expect(mockConsultarFluxo).toHaveBeenCalledWith(validCpf, 'RLIFUND');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should redirect to /cpf when CPF is not found', async () => {
    localStorage.removeItem('cpfDigitado');

    renderHook(() => usePaymentOptions());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cpf');
    });
  });

  it('should redirect to /cpf when CPF is invalid', async () => {
    const invalidCpf = '11111111111'; // All same digits
    localStorage.setItem('cpfDigitado', invalidCpf);

    renderHook(() => usePaymentOptions());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cpf');
    });

    expect(mockConsultarFluxo).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    const validCpf = '12345678909';
    localStorage.setItem('cpfDigitado', validCpf);
    
    const error = new Error('API error');
    mockConsultarFluxo.mockRejectedValue(error);

    const { result } = renderHook(() => usePaymentOptions());

    await waitFor(() => {
      expect(result.current.paymentOptionsLoading).toBe(false);
    });

    expect(result.current.paymentOptions).toEqual({});
  });

  it('should provide refetch function', async () => {
    const validCpf = '12345678909';
    const mockData = { options: ['PIX'] };
    
    localStorage.setItem('cpfDigitado', validCpf);
    mockConsultarFluxo.mockResolvedValue(mockData);

    const { result } = renderHook(() => usePaymentOptions());

    await waitFor(() => {
      expect(result.current.paymentOptionsLoading).toBe(false);
    });

    // Refetch should call the API again
    mockConsultarFluxo.mockClear();
    mockConsultarFluxo.mockResolvedValue({ options: ['CARD'] });

    result.current.refetch();

    await waitFor(() => {
      expect(mockConsultarFluxo).toHaveBeenCalledTimes(1);
    });
  });

  it('should set loading state correctly during fetch', async () => {
    const validCpf = '12345678909';
    localStorage.setItem('cpfDigitado', validCpf);
    
    mockConsultarFluxo.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ options: [] }), 100))
    );

    const { result } = renderHook(() => usePaymentOptions());

    // Should be loading initially
    expect(result.current.paymentOptionsLoading).toBe(true);

    // Should stop loading after fetch completes
    await waitFor(() => {
      expect(result.current.paymentOptionsLoading).toBe(false);
    }, { timeout: 200 });
  });

  it('should memoize return value to prevent unnecessary re-renders', async () => {
    const validCpf = '12345678909';
    const mockData = { options: ['PIX'] };
    
    localStorage.setItem('cpfDigitado', validCpf);
    mockConsultarFluxo.mockResolvedValue(mockData);

    const { result, rerender } = renderHook(() => usePaymentOptions());

    await waitFor(() => {
      expect(result.current.paymentOptionsLoading).toBe(false);
    });

    const firstRender = result.current;
    
    // Rerender without changing any data
    rerender();
    
    const secondRender = result.current;

    // Should return the same memoized object
    expect(firstRender.paymentOptions).toBe(secondRender.paymentOptions);
  });

  it('should call consultarFluxo with correct SLUG', async () => {
    const validCpf = '12345678909';
    localStorage.setItem('cpfDigitado', validCpf);
    mockConsultarFluxo.mockResolvedValue({});

    renderHook(() => usePaymentOptions());

    await waitFor(() => {
      expect(mockConsultarFluxo).toHaveBeenCalledWith(validCpf, 'RLIFUND');
    });
  });

  it('should validate CPF format before making API call', async () => {
    const invalidCpf = 'abc123'; // Invalid format
    localStorage.setItem('cpfDigitado', invalidCpf);

    renderHook(() => usePaymentOptions());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cpf');
    });

    // Should not call API with invalid CPF
    expect(mockConsultarFluxo).not.toHaveBeenCalled();
  });
});
