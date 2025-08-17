
import { API_CONFIG, buildApiUrl } from "@/config/api";
import { getUserId } from "@/utils/userUtils";

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
    console.log(`[consultarFluxo] Iniciando consulta com CPF: ${cpf}, SLUG: ${slug}`);
    
    // Get user ID for header
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado no localStorage. Faça login novamente.');
    }
    
    // Create headers with user ID
    const headers = {
      ...API_CONFIG.defaultHeaders,
      'id_usuario': userId
    };
    
    const url = buildApiUrl('consultaFluxo', { cpf, SLUG: slug });
    console.log(`[consultarFluxo] URL final: ${url}`);
    console.log(`[consultarFluxo] User ID sendo usado: ${userId}`);
    console.log('[consultarFluxo] Headers sendo enviados:', headers);
    
    try {
      console.log('[consultarFluxo] Fazendo fetch...');
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      console.log('[consultarFluxo] Response recebido:');
      console.log('- Status:', response.status);
      console.log('- Status text:', response.statusText);
      console.log('- OK:', response.ok);
      console.log('- Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error(`[consultarFluxo] Erro na requisição: ${response.status} - ${response.statusText}`);
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("[consultarFluxo] Dados recebidos:", data);
      return data;
    } catch (error) {
      console.error('[consultarFluxo] Erro capturado:', error);
      console.error('[consultarFluxo] Tipo do erro:', typeof error);
      console.error('[consultarFluxo] Message do erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    }
  },

  async consultarFluxoDetalhe(slug: string): Promise<ConsultaFluxoDetalheResponse> {
    console.log(`[consultarFluxoDetalhe] Iniciando consulta com SLUG: ${slug}`);
    
    // Get user ID for header
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado no localStorage. Faça login novamente.');
    }
    
    // Create headers with user ID
    const headers = {
      ...API_CONFIG.defaultHeaders,
      'id_usuario': userId
    };
    
    const url = buildApiUrl('consultaFluxoDetalhe', { SLUG: slug });
    console.log(`[consultarFluxoDetalhe] URL final: ${url}`);
    console.log(`[consultarFluxoDetalhe] User ID sendo usado: ${userId}`);
    console.log('[consultarFluxoDetalhe] Headers sendo enviados:', headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Resposta da API consultaFluxoDetalhe:", data);
    return data;
  }
};
