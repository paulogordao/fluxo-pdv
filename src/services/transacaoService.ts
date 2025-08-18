import { buildApiUrl, API_CONFIG } from '@/config/api';
import { TransacaoResponse } from '@/types/transacao';
import { getUserId } from '@/utils/userUtils';

export const transacaoService = {
  async buscarTransacoes(): Promise<TransacaoResponse> {
    try {
      const userId = getUserId();
      
      if (!userId) {
        throw new Error("ID do usuário não encontrado");
      }

      const url = buildApiUrl('transacoes');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...API_CONFIG.defaultHeaders,
          'id_usuario': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[transacaoService] Erro ao buscar transações:', error);
      throw error;
    }
  },
};