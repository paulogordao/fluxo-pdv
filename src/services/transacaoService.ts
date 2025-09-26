import { buildApiUrl, API_CONFIG } from '@/config/api';
import { TransacaoResponse, TransacaoEstornoResponse } from '@/types/transacao';
import { getUserId } from '@/utils/userUtils';

export const transacaoService = {
  async buscarTransacoes(): Promise<TransacaoResponse> {
    try {
      const userId = getUserId();
      console.log('[transacaoService] User ID obtido:', userId);
      
      if (!userId) {
        throw new Error("ID do usuário não encontrado");
      }

      const url = buildApiUrl('transacoes');
      console.log('[transacaoService] URL construída:', url);
      
      const headers = {
        ...API_CONFIG.defaultHeaders,
        'User-Agent': 'SimuladorPDV/1.0',
        'id_usuario': userId,
      };
      console.log('[transacaoService] Headers enviados:', headers);
      
      console.log('[transacaoService] Iniciando fetch para:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log('[transacaoService] Response status:', response.status);
      console.log('[transacaoService] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('[transacaoService] Response não OK:', response.status, response.statusText);
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('[transacaoService] Dados recebidos:', data);
      return data;
    } catch (error) {
      console.error('[transacaoService] Erro detalhado:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  },

  async buscarTransacoesPays(): Promise<TransacaoEstornoResponse> {
    try {
      const userId = getUserId();
      console.log('[transacaoService] User ID obtido para Pays:', userId);
      
      if (!userId) {
        throw new Error("ID do usuário não encontrado");
      }

      const url = buildApiUrl('transacoes/pays');
      console.log('[transacaoService] URL construída para Pays:', url);
      
      const headers = {
        ...API_CONFIG.defaultHeaders,
        'User-Agent': 'SimuladorPDV/1.0',
        'id_usuario': userId,
      };
      console.log('[transacaoService] Headers enviados para Pays:', headers);
      
      console.log('[transacaoService] Iniciando fetch para Pays:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log('[transacaoService] Response status Pays:', response.status);
      console.log('[transacaoService] Response headers Pays:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('[transacaoService] Response não OK Pays:', response.status, response.statusText);
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('[transacaoService] Dados recebidos Pays:', data);
      return data;
    } catch (error) {
      console.error('[transacaoService] Erro detalhado Pays:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  },
};