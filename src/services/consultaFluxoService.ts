
import { API_CONFIG, buildApiUrl } from "@/config/api";

export interface ConsultaFluxoResponse {
  identificacao_usuario?: number;
  pedir_telefone?: boolean;
  possui_dotz?: boolean;
  outros_meios_pagamento?: boolean;
  dotz_sem_app?: boolean;
  SLUG?: string;
}

export interface ConsultaFluxoDetalheResponse {
  request_servico?: any;
  response_servico_anterior?: any;
}

export const consultaFluxoService = {
  async consultarFluxo(cpf: string, slug: string): Promise<ConsultaFluxoResponse> {
    const url = buildApiUrl('consultaFluxo', { cpf, SLUG: slug });
    console.log(`Consultando fluxo: ${url}`);
    console.log('Headers sendo enviados:', API_CONFIG.defaultHeaders);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.defaultHeaders
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Resposta da API consultaFluxo:", data);
    return data;
  },

  async consultarFluxoDetalhe(slug: string): Promise<ConsultaFluxoDetalheResponse> {
    const url = buildApiUrl('consultaFluxoDetalhe', { SLUG: slug });
    console.log(`Consultando detalhes do fluxo: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.defaultHeaders
    });
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Resposta da API consultaFluxoDetalhe:", data);
    return data;
  }
};
