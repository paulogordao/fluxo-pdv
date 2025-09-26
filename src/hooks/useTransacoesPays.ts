import { useQuery } from '@tanstack/react-query';
import { transacaoService } from '@/services/transacaoService';

export const useTransacoesPays = () => {
  return useQuery({
    queryKey: ['transacoesPays'],
    queryFn: transacaoService.buscarTransacoesPays,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};