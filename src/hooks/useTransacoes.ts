import { useQuery } from '@tanstack/react-query';
import { transacaoService } from '@/services/transacaoService';

export const useTransacoes = () => {
  return useQuery({
    queryKey: ['transacoes'],
    queryFn: transacaoService.buscarTransacoes,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3, // Increased retry attempts with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
