import { buildApiUrl, API_CONFIG } from '@/config/api';
import { TransacaoResponse, TransacaoEstornoResponse } from '@/types/transacao';
import { getUserId } from '@/utils/userUtils';
import { createLogger } from '@/utils/logger';

const log = createLogger('transacaoService');

export const transacaoService = {
  async buscarTransacoes(): Promise<TransacaoResponse> {
    try {
      const userId = getUserId();
      log.info('User ID obtido:', userId);
      
      if (!userId) {
        throw new Error("ID do usuário não encontrado");
      }

      const url = buildApiUrl('transacoes');
      log.info('URL construída:', url);
      
      const headers = {
        ...API_CONFIG.defaultHeaders,
        'User-Agent': 'SimuladorPDV/1.0',
        'id_usuario': userId,
      };
      log.debug('Headers enviados:', headers);
      
      log.info('Iniciando fetch para:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      log.info('Response status:', response.status);
      log.debug('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        log.error('Response não OK:', response.status, response.statusText);
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      log.info('Dados recebidos:', data);
      return data;
    } catch (error) {
      log.error('Erro detalhado:', {
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
      log.info('User ID obtido para Pays:', userId);
      
      if (!userId) {
        throw new Error("ID do usuário não encontrado");
      }

      const url = buildApiUrl('transacoes/pays');
      log.info('URL construída para Pays:', url);
      
      const headers = {
        ...API_CONFIG.defaultHeaders,
        'User-Agent': 'SimuladorPDV/1.0',
        'id_usuario': userId,
      };
      log.debug('Headers enviados para Pays:', headers);
      
      log.info('Iniciando fetch para Pays:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      log.info('Response status Pays:', response.status);
      log.debug('Response headers Pays:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        log.error('Response não OK Pays:', response.status, response.statusText);
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      log.info('Dados recebidos Pays:', data);
      return data;
    } catch (error) {
      log.error('Erro detalhado Pays:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  },

  async estornarTransacao(id: string, transactionId: string, cpf: string): Promise<any> {
    try {
      const userId = getUserId();
      log.info('Estornando transação:', { id, transactionId, cpf, userId });
      
      if (!userId) {
        throw new Error("ID do usuário não encontrado");
      }

      const url = buildApiUrl('transacoes/estorno');
      log.info('URL construída para estorno:', url);
      
      const headers = {
        ...API_CONFIG.defaultHeaders,
        'User-Agent': 'SimuladorPDV/1.0',
        'id_usuario': userId,
      };

      const body = {
        id,
        transaction_id: transactionId,
        cpf
      };

      log.info('Dados do estorno:', body);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      log.info('Response status estorno:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        log.error('Erro no estorno:', response.status, errorData);
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      log.info('Resposta do estorno:', data);
      
      // Verificar se o estorno foi bem-sucedido
      if (data.response?.success === false) {
        const errorMessage = data.response?.errors?.[0]?.message || 'Erro desconhecido ao processar estorno';
        log.error('Erro retornado pela API:', errorMessage);
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      log.error('Erro detalhado no estorno:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  },
};