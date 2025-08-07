import { buildApiUrl, API_CONFIG } from '@/config/api';

export interface ComandoRequest {
  comando: string;
  cpf: string;
}

export interface ComandoResponse {
  request: {
    data: {
      route: string;
      version: number;
      input: {
        customer_info_id: string;
        customer_info_id_type: number;
        employee_id: string;
        pos_id: string;
        order_id: string;
      };
    };
  };
  response: {
    data: {
      customer: {
        first_name: string;
        document: string;
      };
      transaction_id: string;
      customer_info_id: string;
      message: {
        id: number;
        content: string;
        link_image: string | null;
      };
      next_step: Array<{
        code: number;
        description: string;
        version: number;
      }>;
      break_step: Array<{
        code: number;
        description: string;
        version: number;
      }>;
    };
    success: boolean;
  };
}

export const comandoService = {
  async enviarComando(comando: string, cpf: string): Promise<ComandoResponse> {
    console.log(`[comandoService] Enviando comando: ${comando}, CPF: ${cpf}`);
    
    const url = buildApiUrl('comando');
    const requestBody: ComandoRequest = {
      comando,
      cpf
    };
    
    console.log(`[comandoService] URL: ${url}`);
    console.log(`[comandoService] Request body:`, requestBody);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: API_CONFIG.defaultHeaders,
        body: JSON.stringify(requestBody)
      });
      
      console.log(`[comandoService] Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ComandoResponse = await response.json();
      console.log(`[comandoService] Response data:`, data);
      
      if (!data.response || !data.response.success) {
        throw new Error('Resposta do serviço indica falha');
      }
      
      return data;
    } catch (error) {
      console.error('[comandoService] Erro ao enviar comando:', error);
      throw error;
    }
  }
};