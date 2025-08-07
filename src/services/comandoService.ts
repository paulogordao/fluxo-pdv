import { buildApiUrl, API_CONFIG } from '@/config/api';

export interface ComandoRequest {
  comando: string;
  cpf: string;
}

export interface ComandoRlicellRequest {
  comando: string;
  telefone: string;
  id_transaction: string;
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
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: API_CONFIG.defaultHeaders,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
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
      clearTimeout(timeoutId);
      console.error('[comandoService] Erro ao enviar comando:', error);
      throw error;
    }
  },

  async enviarComandoRlicell(telefone: string, transactionId: string): Promise<ComandoResponse> {
    console.log(`[comandoService] Enviando comando RLICELL: telefone=${telefone}, transaction_id=${transactionId}`);
    
    const url = buildApiUrl('comando');
    const requestBody: ComandoRlicellRequest = {
      comando: "RLICELL",
      telefone,
      id_transaction: transactionId
    };
    
    console.log(`[comandoService] URL: ${url}`);
    console.log(`[comandoService] Request body:`, requestBody);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: API_CONFIG.defaultHeaders,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
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
      clearTimeout(timeoutId);
      console.error('[comandoService] Erro ao enviar comando RLICELL:', error);
      throw error;
    }
  }
};