import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transacaoService } from '@/services/transacaoService';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/utils/logger';

const log = createLogger('useEstornoTransacao');

interface EstornoParams {
  id: string;
  transactionId: string;
  cpf: string;
}

export const useEstornoTransacao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, transactionId, cpf }: EstornoParams) =>
      transacaoService.estornarTransacao(id, transactionId, cpf),
    onSuccess: (data) => {
      const successMessage = data?.response?.data?.message?.content || "A transação foi estornada com sucesso.";
      toast({
        title: "Estorno realizado com sucesso",
        description: successMessage,
        variant: "default",
      });
      
      // Invalidar e refetch das transações para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['transacoes-pays'] });
    },
    onError: (error: Error) => {
      log.error('Erro:', error);
      toast({
        title: "Erro ao realizar estorno",
        description: error.message || "Ocorreu um erro ao tentar estornar a transação.",
        variant: "destructive",
      });
    },
  });
};