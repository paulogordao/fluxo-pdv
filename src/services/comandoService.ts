import { buildApiUrl, API_CONFIG } from '@/config/api';
import { getUserId } from '@/utils/userUtils';

export interface ComandoRequest {
  comando: string;
  cpf: string;
  version?: string;
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

export interface RlidealOrderItem {
  ean: string;
  sku: string;
  unit_price: number;
  discount: number;
  quantity: number;
  name: string;
  unit_type: string;
  brand: string;
  manufacturer: string;
  categories: string[];
  gross_profit_amount: number;
  is_private_label: boolean;
  is_on_sale: boolean;
}

export interface ComandoRlidealUatV1Request {
  comando: string;
  id_transaction: string;
  use_product_dz: number;
  order: {
    value_total: number;
    discount: number;
    date: string;
    items: RlidealOrderItem[];
  };
}

export interface ComandoRliauthRequest {
  comando: string;
  id_transaction: string;
  token: string;
  cancel: boolean;
}

export interface PaymentItem {
  type: number;
  bin: string;
  amount: number;
  description: string;
}

export interface ComandoRlipaysRequest {
  comando: string;
  id_transaction: string;
  payments?: PaymentItem[];
}

export interface ComandoRliwaitRequest {
  comando: string;
  id_transaction: string;
}

export interface ComandoRliquitRequest {
  comando: string;
  id_transaction: string;
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
  async enviarComando(comando: string, cpf: string, version?: string): Promise<ComandoResponse> {
    console.log(`[comandoService] Enviando comando: ${comando}, CPF: ${cpf}, Version: ${version || 'não especificada'}`);
    
    // Get user ID for header
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado no localStorage. Faça login novamente.');
    }
    
    const url = buildApiUrl('comando?=');
    const requestBody: ComandoRequest = {
      comando,
      cpf,
      ...(version && { version })
    };
    
    console.log(`[comandoService] URL: ${url}`);
    console.log(`[comandoService] Request body:`, requestBody);
    console.log(`[comandoService] User ID sendo usado: ${userId}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...API_CONFIG.defaultHeaders,
          'id_usuario': userId
        },
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
    
    // Get user ID for header
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado no localStorage. Faça login novamente.');
    }
    
    const url = buildApiUrl('comando?=');
    const requestBody: ComandoRlicellRequest = {
      comando: "RLICELL",
      telefone,
      id_transaction: transactionId
    };
    
    console.log(`[comandoService] URL: ${url}`);
    console.log(`[comandoService] Request body:`, requestBody);
    console.log(`[comandoService] User ID sendo usado: ${userId}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...API_CONFIG.defaultHeaders,
          'id_usuario': userId
        },
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
    
    // Get user ID for header
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado no localStorage. Faça login novamente.');
    }
    
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
    console.log(`[comandoService] User ID sendo usado: ${userId}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...API_CONFIG.defaultHeaders,
          'id_usuario': userId
        },
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

  async enviarComandoRlidealUatV1(transactionId: string, order: ComandoRlidealUatV1Request['order']): Promise<ComandoResponse> {
    console.log(`[comandoService] Enviando comando RLIDEAL UAT V1: transaction_id=${transactionId}`);
    console.log(`[comandoService] Order data:`, order);
    
    // Get user ID for header
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado no localStorage. Faça login novamente.');
    }
    
    const url = buildApiUrl('comando?=');
    const requestBody: ComandoRlidealUatV1Request = {
      comando: "RLIDEAL",
      id_transaction: transactionId,
      use_product_dz: 1,
      order
    };
    
    console.log(`[comandoService] URL: ${url}`);
    console.log(`[comandoService] Request body:`, requestBody);
    console.log(`[comandoService] User ID sendo usado: ${userId}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...API_CONFIG.defaultHeaders,
          'id_usuario': userId
        },
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
      console.error('[comandoService] Erro ao enviar comando RLIDEAL UAT V1:', error);
      throw error;
    }
  },

  // RLIDEAL command method
  async enviarComandoRlideal(transactionId: string, paymentOption: string): Promise<ComandoResponse> {
    // Get user ID for header
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado no localStorage. Faça login novamente.');
    }

    const requestBody: ComandoRlidealRequest = {
      comando: 'RLIDEAL',
      payment_option: paymentOption,
      id_transaction: transactionId
    };

    console.log(`[comandoService] Enviando comando RLIDEAL:`, requestBody);
    console.log(`[comandoService] User ID sendo usado: ${userId}`);

    const timeoutId = setTimeout(() => {
      throw new Error('TIMEOUT');
    }, 30000);

    try {
      const url = buildApiUrl('comando?=');
      console.log(`[comandoService] RLIDEAL URL: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...API_CONFIG.defaultHeaders,
          'id_usuario': userId
        },
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
    // Get user ID for header
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado no localStorage. Faça login novamente.');
    }

    const requestBody: ComandoRliauthRequest = {
      comando: 'RLIAUTH',
      id_transaction: transactionId,
      token: token,
      cancel: false
    };

    console.log(`[comandoService] Enviando comando RLIAUTH:`, requestBody);
    console.log(`[comandoService] User ID sendo usado: ${userId}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      const url = buildApiUrl('comando?=');
      console.log(`[comandoService] RLIAUTH URL: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...API_CONFIG.defaultHeaders,
          'id_usuario': userId
        },
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
  },

  // RLIPAYS command method
  async enviarComandoRlipays(transactionId: string, payments?: PaymentItem[]): Promise<ComandoResponse> {
    // Get user ID for header
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado no localStorage. Faça login novamente.');
    }

    const requestBody: ComandoRlipaysRequest = {
      comando: 'RLIPAYS',
      id_transaction: transactionId,
      ...(payments && payments.length > 0 && { payments })
    };

    console.log(`[comandoService] Enviando comando RLIPAYS:`, requestBody);
    console.log(`[comandoService] Payments array:`, payments);
    console.log(`[comandoService] User ID sendo usado: ${userId}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      const url = buildApiUrl('comando?=');
      console.log(`[comandoService] RLIPAYS URL: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...API_CONFIG.defaultHeaders,
          'id_usuario': userId
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`[comandoService] RLIPAYS Response status:`, response.status);
      console.log(`[comandoService] RLIPAYS Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`[comandoService] RLIPAYS Raw response:`, responseText);

      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[comandoService] RLIPAYS JSON parse error:`, parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      // Adaptive parsing: handle both object and array responses
      let data: ComandoResponse;
      if (Array.isArray(parsedData)) {
        console.log(`[comandoService] RLIPAYS Response is already an array`);
        data = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        console.log(`[comandoService] RLIPAYS Response is an object, converting to array`);
        data = [parsedData];
      } else {
        console.error(`[comandoService] RLIPAYS Unexpected response format:`, parsedData);
        throw new Error(`Formato de resposta inesperado: esperado objeto ou array`);
      }

      console.log(`[comandoService] RLIPAYS Final data:`, data);

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
        console.log(`[comandoService] RLIPAYS Response is string, checking for errors:`, data[0].response);
        
        // Try to parse RLIPAYS error from string response
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
      console.error('[comandoService] Erro ao enviar comando RLIPAYS:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      
      throw error;
    }
  },

  // RLIWAIT command method
  async enviarComandoRliwait(transactionId: string): Promise<ComandoResponse> {
    // Get user ID for header
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado no localStorage. Faça login novamente.');
    }

    const requestBody: ComandoRliwaitRequest = {
      comando: 'RLIWAIT',
      id_transaction: transactionId
    };

    console.log(`[comandoService] Enviando comando RLIWAIT:`, requestBody);
    console.log(`[comandoService] User ID sendo usado: ${userId}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      const url = buildApiUrl('comando?=');
      console.log(`[comandoService] RLIWAIT URL: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...API_CONFIG.defaultHeaders,
          'id_usuario': userId
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`[comandoService] RLIWAIT Response status:`, response.status);
      console.log(`[comandoService] RLIWAIT Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`[comandoService] RLIWAIT Raw response:`, responseText);

      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[comandoService] RLIWAIT JSON parse error:`, parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      // Adaptive parsing: handle both object and array responses
      let data: ComandoResponse;
      if (Array.isArray(parsedData)) {
        console.log(`[comandoService] RLIWAIT Response is already an array`);
        data = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        console.log(`[comandoService] RLIWAIT Response is an object, converting to array`);
        data = [parsedData];
      } else {
        console.error(`[comandoService] RLIWAIT Unexpected response format:`, parsedData);
        throw new Error(`Formato de resposta inesperado: esperado objeto ou array`);
      }

      console.log(`[comandoService] RLIWAIT Final data:`, data);

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
        console.log(`[comandoService] RLIWAIT Response is string, checking for errors:`, data[0].response);
        
        // Try to parse RLIWAIT error from string response
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
      console.error('[comandoService] Erro ao enviar comando RLIWAIT:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      
      throw error;
    }
  },

  // RLIQUIT command method
  async enviarComandoRliquit(transactionId: string): Promise<ComandoResponse> {
    // Get user ID for header
    const userId = getUserId();
    if (!userId) {
      throw new Error('ID do usuário não encontrado no localStorage. Faça login novamente.');
    }

    const requestBody: ComandoRliquitRequest = {
      comando: 'RLIQUIT',
      id_transaction: transactionId
    };

    console.log(`[comandoService] Enviando comando RLIQUIT:`, requestBody);
    console.log(`[comandoService] User ID sendo usado: ${userId}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      const url = buildApiUrl('comando?=');
      console.log(`[comandoService] RLIQUIT URL: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...API_CONFIG.defaultHeaders,
          'id_usuario': userId
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`[comandoService] RLIQUIT Response status:`, response.status);
      console.log(`[comandoService] RLIQUIT Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`[comandoService] RLIQUIT Raw response:`, responseText);

      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[comandoService] RLIQUIT JSON parse error:`, parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      // Adaptive parsing: handle both object and array responses
      let data: ComandoResponse;
      if (Array.isArray(parsedData)) {
        console.log(`[comandoService] RLIQUIT Response is already an array`);
        data = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        console.log(`[comandoService] RLIQUIT Response is an object, converting to array`);
        data = [parsedData];
      } else {
        console.error(`[comandoService] RLIQUIT Unexpected response format:`, parsedData);
        throw new Error(`Formato de resposta inesperado: esperado objeto ou array`);
      }

      console.log(`[comandoService] RLIQUIT Final data:`, data);

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
        console.log(`[comandoService] RLIQUIT Response is string, checking for errors:`, data[0].response);
        
        // Try to parse RLIQUIT error from string response
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
      console.error('[comandoService] Erro ao enviar comando RLIQUIT:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      
      throw error;
    }
  }
};