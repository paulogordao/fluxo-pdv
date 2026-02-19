
import { API_CONFIG } from "@/config/api";

export interface LoginResponse {
  mensagem: string;
  code: number;
  id_usuario?: string;
  primeiro_acesso?: boolean;
}

export interface AccessRequestData {
  nome_empresa: string;
  cnpj: string;
  email: string;
  nome: string;
}

export interface AccessRequestResponse {
  status: string;
  code?: number;
  mensagem?: string;
}

export interface ResetPasswordResponse {
  status: string;
  code: number;
  mensagem?: string;
}

export interface ForgotPasswordResponse {
  status: string;
  code: number;
  mensagem?: string;
}

export const authService = {
  async validateUser(email: string, senha: string): Promise<LoginResponse> {
    const response = await fetch(`${API_CONFIG.baseUrl}/validaUsuario`, {
      method: "POST",
      headers: API_CONFIG.defaultHeaders,
      body: JSON.stringify({
        email,
        senha
      })
    });

    if (!response.ok) {
      throw new Error('Erro de conexão. Tente novamente.');
    }

    return response.json();
  },

  async requestAccess(data: AccessRequestData): Promise<AccessRequestResponse> {
    const response = await fetch(`${API_CONFIG.baseUrl}/usuarios/solicitar_acesso`, {
      method: "POST",
      headers: API_CONFIG.defaultHeaders,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Erro de conexão. Tente novamente.');
    }

    return response.json();
  },

  async resetPassword(userId: string, novaSenha: string): Promise<ResetPasswordResponse> {
    const response = await fetch(`${API_CONFIG.baseUrl}/usuarios/redefinir_senha`, {
      method: "POST",
      headers: {
        ...API_CONFIG.defaultHeaders,
        "id-usuario": userId
      },
      body: JSON.stringify({
        nova_senha: novaSenha
      })
    });

    if (!response.ok) {
      throw new Error('Erro de conexão. Tente novamente.');
    }

    return response.json();
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await fetch(`${API_CONFIG.baseUrl}/usuarios/esqueci_senha`, {
      method: "POST",
      headers: API_CONFIG.defaultHeaders,
      body: JSON.stringify({
        email
      })
    });

    if (!response.ok) {
      throw new Error('Erro de conexão. Tente novamente.');
    }

    return response.json();
  }
};
