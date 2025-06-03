
import { API_CONFIG } from "@/config/api";

export interface CreateUserData {
  usuario: string;
  nome: string;
  email: string;
  empresa_id: string;
  perfil: string;
}

export interface AccessRequest {
  id: string;
  created_at: string;
  email: string;
  nome: string;
  nome_empresa: string;
  cnpj_empresa: string;
  visivel: boolean;
}

export const userService = {
  async createUser(userData: CreateUserData, userId: string) {
    const response = await fetch(`${API_CONFIG.baseUrl}/usuarios`, {
      method: 'POST',
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id_usuario': userId,
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    return response.json();
  },

  async getAccessRequests(userId: string) {
    const response = await fetch(`${API_CONFIG.baseUrl}/usuarios/solicitar_acesso`, {
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id_usuario': userId,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch access requests');
    }

    return response.json();
  }
};
