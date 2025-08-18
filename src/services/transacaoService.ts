import { buildApiUrl, API_CONFIG } from '@/config/api';
import { TransacaoResponse } from '@/types/transacao';

export const transacaoService = {
  async buscarTransacoes(): Promise<TransacaoResponse> {
    try {
      const userUuid = sessionStorage.getItem("user.uuid");
      
      if (!userUuid) {
        throw new Error("UUID do usuário não encontrado");
      }

      const url = buildApiUrl('transacoes');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...API_CONFIG.defaultHeaders,
          'id_usuario': userUuid,
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