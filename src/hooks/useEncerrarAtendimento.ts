import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { comandoService } from '@/services/comandoService';

export const useEncerrarAtendimento = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const openModal = () => {
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  const encerrarAtendimento = async () => {
    const transactionId = localStorage.getItem('transactionId');
    
    if (!transactionId) {
      setError('ID da transação não encontrado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useEncerrarAtendimento] Encerrando atendimento para transactionId:', transactionId);
      
      await comandoService.enviarComandoRliquit(transactionId);
      
      console.log('[useEncerrarAtendimento] Atendimento encerrado com sucesso');
      
      // Limpar dados da sessão
      localStorage.removeItem('transactionId');
      localStorage.removeItem('cpf');
      localStorage.removeItem('telefone');
      localStorage.removeItem('rlifundRequest');
      localStorage.removeItem('rlifundResponse');
      localStorage.removeItem('rlidealResponse');
      localStorage.removeItem('rlipaysResponse');
      
      // Redirecionar para a página inicial
      navigate('/index');
    } catch (error) {
      console.error('[useEncerrarAtendimento] Erro ao encerrar atendimento:', error);
      setError(error instanceof Error ? error.message : 'Erro ao encerrar atendimento');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmarEncerramento = () => {
    setIsModalOpen(false);
    encerrarAtendimento();
  };

  return {
    isModalOpen,
    isLoading,
    error,
    openModal,
    closeModal,
    confirmarEncerramento
  };
};