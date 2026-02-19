import { API_CONFIG, buildApiUrl } from "@/config/api";
import { getUserId } from "@/utils/userUtils";
import { createLogger } from "@/utils/logger";

const log = createLogger('consultaFluxoService');

export interface ConsultaFluxoResponse {
  identificacao_usuario?: number;
  pedir_telefone?: boolean;
  possui_dotz?: boolean;
  outros_meios_pagamento?: boolean;
  dotz_sem_app?: boolean;
  permitir_pagamento_token?: boolean;
  payment_options?: any[];
  SLUG?: string;
}

export interface ConsultaFluxoDetalheResponse {
  nome_request_servico?: string;
  nome_response_servico?: string;
  request_servico?: any;
  response_servico_anterior?: any;
}

export const consultaFluxoService = {
  async consultarFluxo(cpf: string, slug: string): Promise<ConsultaFluxoResponse> {
    log.info(`Iniciando consulta com CPF: ${cpf}, SLUG: ${slug}`);
    
    // Get user ID for header
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado no localStorage. Faça login novamente.');
    }
    
    // Create headers with user ID
    const headers = {
      ...API_CONFIG.defaultHeaders,
      'id-usuario': userId
    };
    
    const url = buildApiUrl('consultaFluxo', { cpf, SLUG: slug });
    log.debug(`URL final: ${url}`);
    log.debug(`User ID sendo usado: ${userId}`);
    log.debug('Headers sendo enviados:', headers);
    
    try {
      log.debug('Fazendo fetch...');
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      log.debug('Response recebido:');
      log.debug('- Status:', response.status);
      log.debug('- Status text:', response.statusText);
      log.debug('- OK:', response.ok);
      log.debug('- Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        log.error(`Erro na requisição: ${response.status} - ${response.statusText}`);
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      const data = await response.json();
      log.debug("Dados recebidos:", data);
      return data;
    } catch (error) {
      log.error('Erro capturado:', error);
      log.error('Tipo do erro:', typeof error);
      log.error('Message do erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    }
  },

  async consultarFluxoDetalhe(slug: string): Promise<ConsultaFluxoDetalheResponse> {
    log.info(`Iniciando consulta com SLUG: ${slug}`);
    
    // Get user ID for header
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado no localStorage. Faça login novamente.');
    }
    
    // Create headers with user ID
    const headers = {
      ...API_CONFIG.defaultHeaders,
      'id-usuario': userId
    };
    
    const url = buildApiUrl('consultaFluxoDetalhe', { SLUG: slug });
    log.debug(`URL final: ${url}`);
    log.debug(`User ID sendo usado: ${userId}`);
    log.debug('Headers sendo enviados:', headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    
    const data = await response.json();
    log.debug("Resposta da API consultaFluxoDetalhe:", data);
    return data;
  }
};
