import { API_CONFIG } from "@/config/api";
import { createLogger } from '@/utils/logger';

const log = createLogger('testUserService');

export interface UsuarioTeste {
  id: string;
  identificacao_usuario: string;
  nome?: string;
  data_nascimento?: string;
  tags?: string;
  pedir_telefone: boolean;
  possui_dotz: boolean;
  outros_meios_pagamento: boolean;
  dotz_sem_app: boolean;
  permitir_pagamento_token: boolean;
  created_at?: string;
  id_empresa?: string;
}

export const testUserService = {
  async getUsuariosTeste(userId: string): Promise<UsuarioTeste[]> {
    const url = `${API_CONFIG.baseUrl}/usuarios_teste`;
    log.info('Fetching usuarios teste from URL:', url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...API_CONFIG.defaultHeaders,
        "id-usuario": userId,
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao carregar usuários de teste");
    }

    const responseData = await response.json();
    log.info("Resposta completa da API:", responseData);
    
    // A API agora retorna um objeto com o campo 'data' contendo o array de usuários
    if (responseData && responseData.data && Array.isArray(responseData.data)) {
      log.info("Dados dos usuários encontrados:", responseData.data);
      return responseData.data;
    }
    
    // Fallback: se não há campo 'data', mas há um array direto
    if (Array.isArray(responseData)) {
      log.info("Dados diretos (array):", responseData);
      return responseData;
    }
    
    // Fallback: se é um objeto único, transformar em array
    if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && responseData.identificacao_usuario) {
      log.info("Objeto único transformado em array:", [responseData]);
      return [responseData];
    }
    
    log.info("Nenhum dado válido encontrado, retornando array vazio");
    return [];
  },

  async createUsuarioTeste(cpf: string, userId: string): Promise<void> {
    const url = `${API_CONFIG.baseUrl}/usuarios_teste`;
    log.info('Creating usuario teste at URL:', url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...API_CONFIG.defaultHeaders,
        "id-usuario": userId,
      },
      body: JSON.stringify({
        cpf_usuario: cpf,
      }),
    });

    if (!response.ok) {
      throw new Error("Erro ao cadastrar usuário de teste");
    }

    const data = await response.json();
    if (data.status !== "ok") {
      throw new Error("Erro ao cadastrar usuário de teste");
    }
  },

  async updateUsuarioTeste(usuario: UsuarioTeste, userId: string): Promise<void> {
    const url = `${API_CONFIG.baseUrl}/usuarios_teste`;
    log.info('Updating usuario teste at URL:', url);
    
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        ...API_CONFIG.defaultHeaders,
        "id-usuario": userId,
      },
      body: JSON.stringify(usuario),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar usuário de teste");
    }

    const data = await response.json();
    if (data.status !== "ok") {
      throw new Error("Erro ao atualizar usuário de teste");
    }
  }
};
