
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

export interface UsuarioData {
  usuario: string;
  nome: string;
  email: string;
  empresa: string;
  empresa_id?: string;
  criado_em: string;
  id: string;
}

export interface UpdateUserData {
  usuario: string;
  nome: string;
  email: string;
  id: string;
  empresa_id: string;
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

  async getUsers(userId: string) {
    const response = await fetch(`${API_CONFIG.baseUrl}/usuarios`, {
      method: 'GET',
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id_usuario': userId,
        'User-Agent': 'SimuladorPDV/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  async getUserById(id: string, userId: string) {
    const response = await fetch(`${API_CONFIG.baseUrl}/usuarios?id_usuario_consulta=${id}`, {
      method: 'GET',
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id_usuario': userId,
        'User-Agent': 'SimuladorPDV/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  async updateUser(userData: UpdateUserData, userId: string) {
    const response = await fetch(`${API_CONFIG.baseUrl}/usuarios`, {
      method: 'PUT',
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id_usuario': userId,
        'User-Agent': 'SimuladorPDV/1.0'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
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
