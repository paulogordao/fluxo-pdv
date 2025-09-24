import { buildApiUrl } from "@/config/api";

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
}

export interface CredentialListResponse {
  data: CredentialListItem[];
}

// Helper function to get user ID from localStorage
const getUserId = (): string | null => {
  // Check for direct userId storage
  const directUserId = localStorage.getItem('userId');
  if (directUserId) return directUserId;
  
  // Check for userData object
  const userData = localStorage.getItem('userData');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      const userId = user.id_usuario || user.id || user.usuario_id;
      if (userId) return userId;
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
  
  // Check for loginResponse data
  const loginResponse = localStorage.getItem('loginResponse');
  if (loginResponse) {
    try {
      const response = JSON.parse(loginResponse);
      if (response.id_usuario) return response.id_usuario;
    } catch (error) {
      console.error('Error parsing login response:', error);
    }
  }
  
  return null;
};

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
        'Content-Type': 'application/json',
        'x-api-key': '0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975',
        'id_usuario': userId,
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
        'x-api-key': '0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975',
        'id_usuario': userId,
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

  async updateCredentialStatus(partnerId: string, enabled: boolean): Promise<CredentialResponse> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    const url = buildApiUrl('credenciais', { id_credencial: partnerId });
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975',
        'id_usuario': userId,
      },
      body: JSON.stringify({ enabled: enabled.toString() }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update credential status: ${errorText}`);
    }

    return await response.json();
  }
};