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

export interface ComandoRlidealRequest {
  comando: string;
  payment_option: string;
  id_transaction: string;
}

export interface ComandoRliauthRequest {
  comando: string;
  id_transaction: string;
  token: string;
  cancel: boolean;
}

export interface RlifundItem {
  ean: string;
  sku: string;
  unit_price: number;
  discount: number;
  quantity: number;
  name: string;
  unit_type: string;
  brand?: string;
  manufacturer?: string;
  categories: string[];
  gross_profit_amount: number;
  is_private_label: boolean;
  is_on_sale: boolean;
}

export interface ComandoRlifundRequest {
  comando: string;
  id_transaction: string;
  payment_option_type: string;
  value_total: string;
  items: RlifundItem[];
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
      payment_options?: any[];
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

// Interfaces para tratamento de erros RLIFUND
export interface RlifundError {
  code: string;
  message: string;
}

export interface RlifundErrorResponse {
  errors: RlifundError[];
  success: false;
}

// Classe customizada para erros da API RLIFUND
export class RlifundApiError extends Error {
  public errorCode: string;
  public errorMessage: string;
  public fullRequest: any;
  public fullResponse: any;

  constructor(errorCode: string, errorMessage: string, fullRequest: any, fullResponse: any) {
    super(`RLIFUND API Error [${errorCode}]: ${errorMessage}`);
    this.name = 'RlifundApiError';
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.fullRequest = fullRequest;
    this.fullResponse = fullResponse;
  }
}

// Função para fazer parse de erros RLIFUND
function parseRlifundError(responseString: string): RlifundErrorResponse | null {
  try {
    console.log('[comandoService] Parsing RLIFUND error string:', responseString);
    
    // Extrair JSON do formato "400 - "{...}""
    const jsonMatch = responseString.match(/^[\d\s-]*"(.+)"$/);
    console.log('[comandoService] JSON match result:', jsonMatch);
    
    if (jsonMatch) {
      const jsonString = jsonMatch[1].replace(/\\"/g, '"');
      console.log('[comandoService] Extracted JSON string:', jsonString);
      const parsed = JSON.parse(jsonString) as RlifundErrorResponse;
      console.log('[comandoService] Parsed error response:', parsed);
      return parsed;
    }
    
    // Tentar parse direto se já for JSON
    console.log('[comandoService] Trying direct JSON parse');
    return JSON.parse(responseString) as RlifundErrorResponse;
  } catch (error) {
    console.error('[comandoService] Erro ao fazer parse do erro RLIFUND:', error);
    console.error('[comandoService] Failed to parse responseString:', responseString);
    return null;
  }
}

export const comandoService = {
  async enviarComando(comando: string, cpf: string): Promise<ComandoResponse> {
    console.log(`[comandoService] Enviando comando: ${comando}, CPF: ${cpf}`);
    
    const url = buildApiUrl('comando?=');
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
    
    const url = buildApiUrl('comando?=');
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
  },

  async enviarComandoRlifund(transactionId: string, paymentOptionType: string, valueTotal: string, items: RlifundItem[]): Promise<ComandoResponse> {
    console.log(`[comandoService] Enviando comando RLIFUND: transaction_id=${transactionId}, payment_option_type=${paymentOptionType}, value_total=${valueTotal}`);
    console.log(`[comandoService] Items:`, items);
    
    const url = buildApiUrl('comando?=');
    const requestBody: ComandoRlifundRequest = {
      comando: "RLIFUND",
      id_transaction: transactionId,
      payment_option_type: paymentOptionType,
      value_total: valueTotal,
      items
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
      
      // Tratamento específico para RLIFUND: response pode ser string quando há erro
      console.log('[comandoService] Checking response type:', typeof data[0].response);
      console.log('[comandoService] Response value:', data[0].response);
      
      if (typeof data[0].response === 'string') {
        console.log(`[comandoService] RLIFUND response é string, tentando parse de erro:`, data[0].response);
        
        const errorData = parseRlifundError(data[0].response);
        console.log('[comandoService] Parse result:', errorData);
        
        if (errorData && !errorData.success && errorData.errors?.length > 0) {
          const firstError = errorData.errors[0];
          console.error(`[comandoService] Erro RLIFUND detectado:`, errorData);
          console.log('[comandoService] Throwing RlifundApiError with code:', firstError.code, 'message:', firstError.message);
          
          throw new RlifundApiError(
            firstError.code,
            firstError.message,
            requestBody,
            data[0]
          );
        }
        
        // Se não conseguir parsear como erro, tratar como falha genérica
        console.error('[comandoService] Could not parse as RLIFUND error, throwing generic error');
        throw new Error(`Resposta RLIFUND em formato inesperado: ${data[0].response}`);
      }
      
      if (data[0].response.success !== true) {
        throw new Error(`Resposta indica falha: success=${data[0].response.success}`);
      }
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[comandoService] Erro ao enviar comando RLIFUND:', error);
      throw error;
    }
  },

  // RLIDEAL command method
  async enviarComandoRlideal(transactionId: string, paymentOption: string): Promise<ComandoResponse> {
    const requestBody: ComandoRlidealRequest = {
      comando: 'RLIDEAL',
      payment_option: paymentOption,
      id_transaction: transactionId
    };

    console.log(`[comandoService] Enviando comando RLIDEAL:`, requestBody);

    const timeoutId = setTimeout(() => {
      throw new Error('TIMEOUT');
    }, 30000);

    try {
      const url = buildApiUrl('comando?=');
      console.log(`[comandoService] RLIDEAL URL: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: API_CONFIG.defaultHeaders,
        body: JSON.stringify(requestBody),
      });

      clearTimeout(timeoutId);

      console.log(`[comandoService] RLIDEAL Response status:`, response.status);
      console.log(`[comandoService] RLIDEAL Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`[comandoService] RLIDEAL Raw response:`, responseText);

      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[comandoService] RLIDEAL JSON parse error:`, parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      // Adaptive parsing: handle both object and array responses
      let data: ComandoResponse;
      if (Array.isArray(parsedData)) {
        console.log(`[comandoService] RLIDEAL Response is already an array`);
        data = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        console.log(`[comandoService] RLIDEAL Response is an object, converting to array`);
        data = [parsedData];
      } else {
        console.error(`[comandoService] RLIDEAL Unexpected response format:`, parsedData);
        throw new Error(`Formato de resposta inesperado: esperado objeto ou array`);
      }

      console.log(`[comandoService] RLIDEAL Final data:`, data);

      if (!Array.isArray(data)) {
        throw new Error('Resposta não é um array');
      }

      if (!data[0]) {
        throw new Error('Array de resposta está vazio');
      }

      if (!data[0].response) {
        throw new Error('Resposta não contém campo response');
      }

      // Check if response is a string (possible error format)
      if (typeof data[0].response === 'string') {
        console.log(`[comandoService] RLIDEAL Response is string, checking for errors:`, data[0].response);
        
        // Try to parse RLIDEAL error from string response
        const errorResponse = parseRlifundError(data[0].response);
        if (errorResponse && !errorResponse.success && errorResponse.errors?.length > 0) {
          const error = errorResponse.errors[0];
          throw new RlifundApiError(error.code, error.message, data[0].request, data[0].response);
        }
        
        // If it's a string but not a structured error, throw generic error
        throw new Error(`Resposta em formato string inesperado: ${data[0].response}`);
      }

      if (data[0].response.success !== true) {
        throw new Error(`Resposta indica falha: success=${data[0].response.success}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[comandoService] Erro ao enviar comando RLIDEAL:', error);
      throw error;
    }
  },

  // RLIAUTH command method
  async enviarComandoRliauth(transactionId: string, token: string): Promise<ComandoResponse> {
    const requestBody: ComandoRliauthRequest = {
      comando: 'RLIAUTH',
      id_transaction: transactionId,
      token: token,
      cancel: false
    };

    console.log(`[comandoService] Enviando comando RLIAUTH:`, requestBody);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      const url = buildApiUrl('comando?=');
      console.log(`[comandoService] RLIAUTH URL: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: API_CONFIG.defaultHeaders,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`[comandoService] RLIAUTH Response status:`, response.status);
      console.log(`[comandoService] RLIAUTH Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`[comandoService] RLIAUTH Raw response:`, responseText);

      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[comandoService] RLIAUTH JSON parse error:`, parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      // Adaptive parsing: handle both object and array responses
      let data: ComandoResponse;
      if (Array.isArray(parsedData)) {
        console.log(`[comandoService] RLIAUTH Response is already an array`);
        data = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        console.log(`[comandoService] RLIAUTH Response is an object, converting to array`);
        data = [parsedData];
      } else {
        console.error(`[comandoService] RLIAUTH Unexpected response format:`, parsedData);
        throw new Error(`Formato de resposta inesperado: esperado objeto ou array`);
      }

      console.log(`[comandoService] RLIAUTH Final data:`, data);

      if (!Array.isArray(data)) {
        throw new Error('Resposta não é um array');
      }

      if (!data[0]) {
        throw new Error('Array de resposta está vazio');
      }

      if (!data[0].response) {
        throw new Error('Resposta não contém campo response');
      }

      // Check if response is a string (possible error format)
      if (typeof data[0].response === 'string') {
        console.log(`[comandoService] RLIAUTH Response is string, checking for errors:`, data[0].response);
        
        // Try to parse RLIAUTH error from string response
        const errorResponse = parseRlifundError(data[0].response);
        if (errorResponse && !errorResponse.success && errorResponse.errors?.length > 0) {
          const error = errorResponse.errors[0];
          throw new RlifundApiError(error.code, error.message, requestBody, data[0]);
        }
        
        // If it's a string but not a structured error, throw generic error
        throw new Error(`Resposta em formato string inesperado: ${data[0].response}`);
      }

      if (data[0].response.success !== true) {
        throw new Error(`Resposta indica falha: success=${data[0].response.success}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[comandoService] Erro ao enviar comando RLIAUTH:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      
      throw error;
    }
  }
};