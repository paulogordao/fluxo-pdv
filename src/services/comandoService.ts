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

export interface ComandoResponseItem {
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

export type ComandoResponse = ComandoResponseItem[];

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
      console.log(`[comandoService] Response ok:`, response.ok);
      console.log(`[comandoService] Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Log raw response text before parsing
      const responseText = await response.text();
      console.log(`[comandoService] Raw response text:`, responseText);
      console.log(`[comandoService] Response text length:`, responseText.length);
      console.log(`[comandoService] Response text type:`, typeof responseText);

      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
        console.log(`[comandoService] Parsed JSON data:`, parsedData);
        console.log(`[comandoService] Parsed data type:`, typeof parsedData);
      } catch (parseError) {
        console.error(`[comandoService] JSON parse error:`, parseError);
        console.error(`[comandoService] Failed to parse:`, responseText.substring(0, 500));
        throw new Error(`Falha ao fazer parse da resposta JSON: ${parseError.message}`);
      }
      
      // Adaptive parsing: handle both object and array responses
      let data: ComandoResponse;
      if (Array.isArray(parsedData)) {
        console.log(`[comandoService] Response is already an array`);
        data = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        console.log(`[comandoService] Response is an object, converting to array`);
        data = [parsedData];
      } else {
        console.error(`[comandoService] Unexpected response format:`, parsedData);
        throw new Error(`Formato de resposta inesperado: esperado objeto ou array`);
      }
      
      // Debug validation step by step
      console.log(`[comandoService] Final data (normalized to array):`, data);
      console.log(`[comandoService] Array check:`, Array.isArray(data));
      console.log(`[comandoService] First item exists:`, !!data[0]);
      console.log(`[comandoService] Response exists:`, !!data[0]?.response);
      console.log(`[comandoService] Success value:`, data[0]?.response?.success);
      console.log(`[comandoService] Success type:`, typeof data[0]?.response?.success);
      
      if (!Array.isArray(data)) {
        throw new Error('Resposta não é um array');
      }
      
      if (!data[0]) {
        throw new Error('Array de resposta está vazio');
      }
      
      if (!data[0].response) {
        throw new Error('Resposta não contém campo response');
      }
      
      if (data[0].response.success !== true) {
        throw new Error(`Resposta indica falha: success=${data[0].response.success}`);
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
      console.log(`[comandoService] Response ok:`, response.ok);
      console.log(`[comandoService] Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Log raw response text before parsing
      const responseText = await response.text();
      console.log(`[comandoService] Raw response text:`, responseText);
      console.log(`[comandoService] Response text length:`, responseText.length);
      console.log(`[comandoService] Response text type:`, typeof responseText);

      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
        console.log(`[comandoService] Parsed JSON data:`, parsedData);
        console.log(`[comandoService] Parsed data type:`, typeof parsedData);
      } catch (parseError) {
        console.error(`[comandoService] JSON parse error:`, parseError);
        console.error(`[comandoService] Failed to parse:`, responseText.substring(0, 500));
        throw new Error(`Falha ao fazer parse da resposta JSON: ${parseError.message}`);
      }
      
      // Adaptive parsing: handle both object and array responses
      let data: ComandoResponse;
      if (Array.isArray(parsedData)) {
        console.log(`[comandoService] Response is already an array`);
        data = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        console.log(`[comandoService] Response is an object, converting to array`);
        data = [parsedData];
      } else {
        console.error(`[comandoService] Unexpected response format:`, parsedData);
        throw new Error(`Formato de resposta inesperado: esperado objeto ou array`);
      }
      
      // Debug validation step by step
      console.log(`[comandoService] Final data (normalized to array):`, data);
      console.log(`[comandoService] Array check:`, Array.isArray(data));
      console.log(`[comandoService] First item exists:`, !!data[0]);
      console.log(`[comandoService] Response exists:`, !!data[0]?.response);
      console.log(`[comandoService] Success value:`, data[0]?.response?.success);
      console.log(`[comandoService] Success type:`, typeof data[0]?.response?.success);
      
      if (!Array.isArray(data)) {
        throw new Error('Resposta não é um array');
      }
      
      if (!data[0]) {
        throw new Error('Array de resposta está vazio');
      }
      
      if (!data[0].response) {
        throw new Error('Resposta não contém campo response');
      }
      
      if (data[0].response.success !== true) {
        throw new Error(`Resposta indica falha: success=${data[0].response.success}`);
      }
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[comandoService] Erro ao enviar comando RLICELL:', error);
      throw error;
    }
  }
};