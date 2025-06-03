
import { API_CONFIG } from "@/config/api";

export interface Empresa {
  id: string;
  nome: string;
}

export const empresaService = {
  async getEmpresas(userId: string) {
    const response = await fetch(`${API_CONFIG.baseUrl}/empresas`, {
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id_usuario': userId,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch empresas');
    }

    return response.json();
  }
};
