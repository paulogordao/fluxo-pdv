import { useQuery } from '@tanstack/react-query';
import { transacaoService } from '@/services/transacaoService';

export const useTransacoes = () => {
  return useQuery({
    queryKey: ['transacoes'],
    queryFn: transacaoService.buscarTransacoes,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};