import { buildApiUrl, API_CONFIG } from "@/config/api";
import { getUserId } from "@/utils/userUtils";

export interface CredentialData {
  cnpj: string;
  client_id: string;
  client_secret: string;
  pfx_password: string;
  pfx_file: string; // Base64 encoded string
  description: string;
  ambiente: string;
}

export interface CredentialResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface CredentialListItem {
  partner_id: string;
  enabled: boolean;
  description: string;
  updated_at?: string;
  ambiente?: string;
  healthStatus?: 'loading' | 'healthy' | 'unhealthy' | 'not-checked';
  healthError?: any;
}

export interface HealthCheckResponse {
  status: number;
  message: string | null;
}

export interface CredentialListResponse {
  data: CredentialListItem[];
}


export const credentialsService = {
  async createCredential(data: CredentialData): Promise<CredentialResponse> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    const url = buildApiUrl('credenciais');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id-usuario': userId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create credential: ${errorText}`);
    }

    return await response.json();
  },

  async getCredentials(): Promise<CredentialListItem[]> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    const url = buildApiUrl('credenciais');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id-usuario': userId,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch credentials: ${errorText}`);
    }

    const result = await response.json();
    
    // Handle different response structures
    if (result && Array.isArray(result.data)) {
      return result.data;
    }
    
    if (result && Array.isArray(result)) {
      return result;
    }
    
    // Return empty array if no valid data structure found
    return [];
  },

  async getCredentialById(credentialId: string): Promise<{ ambiente: string }> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    const url = buildApiUrl('credenciais', { id: credentialId });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id-usuario': userId,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch credential: ${errorText}`);
    }

    return await response.json();
  },

  async updateCredentialStatus(partnerId: string, enabled: boolean): Promise<CredentialResponse> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    const url = buildApiUrl('credenciais', { id_credencial: partnerId });
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id-usuario': userId,
      },
      body: JSON.stringify({ enabled: enabled.toString() }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update credential status: ${errorText}`);
    }

    return await response.json();
  },

  async checkCredentialHealth(partnerId: string): Promise<HealthCheckResponse> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    const url = buildApiUrl('credenciais', { id: partnerId, status: 'true' });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id-usuario': userId,
      },
    });

    const responseJson = await response.json();
    
    // Handle normalized API format: {status: 200, message: null} for success
    // Any status !== 200 is an error with message
    if (responseJson.status !== 200) {
      throw new Error(responseJson.message || 'Health check failed');
    }

    return responseJson;
  },

  async getCredentialByUser(): Promise<{ 
    ambiente: string; 
    description?: string; 
    cnpj_id?: string; 
    enabled?: boolean 
  }> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    const url = buildApiUrl('credencialPorUsuario');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...API_CONFIG.defaultHeaders,
        'id-usuario': userId,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch credential by user: ${errorText}`);
    }

    return await response.json();
  }
};