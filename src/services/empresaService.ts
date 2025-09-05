import { API_CONFIG } from "@/config/api";

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  endereco: string;
  descricao: string | null;
  tipo_simulacao?: string;
  id_credencial?: string | null;
  created_at: string;
}

export interface CreateEmpresaData {
  nome: string;
  cnpj: string;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  descricao?: string | null;
  tipo_simulacao?: string;
  id_credencial?: string | null;
}

export interface UpdateEmpresaData {
  nome?: string;
  cnpj?: string;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  descricao?: string | null;
  tipo_simulacao?: string;
  id_credencial?: string | null;
}

export const empresaService = {
  async getEmpresas(userId: string): Promise<Empresa[]> {
    const response = await fetch(`${API_CONFIG.baseUrl}/empresas`, {
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id_usuario': userId,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch empresas');
    }

    const data = await response.json();
    
    // Handle both array and object responses
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      return [];
    }
  },

  async getEmpresaById(id: string, userId: string): Promise<Empresa> {
    const response = await fetch(`${API_CONFIG.baseUrl}/empresas?id=${id}`, {
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id_usuario': userId,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  async createEmpresa(data: CreateEmpresaData, userId: string) {
    const payload = {
      nome: data.nome,
      cnpj: data.cnpj,
      email: data.email || null,
      telefone: data.telefone || null,
      endereco: data.endereco || null,
      descricao: data.descricao || null,
      tipo_simulacao: data.tipo_simulacao || null,
      id_credencial: data.id_credencial || null,
    };

    const response = await fetch(`${API_CONFIG.baseUrl}/empresas`, {
      method: 'POST',
      headers: {
        ...API_CONFIG.defaultHeaders,
        'Content-Type': 'application/json',
        'id_usuario': userId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  async updateEmpresa(id: string, data: UpdateEmpresaData, userId: string) {
    const payload = {
      nome: data.nome,
      cnpj: data.cnpj,
      email: data.email || null,
      telefone: data.telefone || null,
      endereco: data.endereco || null,
      descricao: data.descricao || null,
      tipo_simulacao: data.tipo_simulacao || null,
      id_credencial: data.id_credencial || null,
    };

    const response = await fetch(`${API_CONFIG.baseUrl}/empresas?id=${id}`, {
      method: 'PUT',
      headers: {
        ...API_CONFIG.defaultHeaders,
        'Content-Type': 'application/json',
        'id_usuario': userId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
};
