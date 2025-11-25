import { buildApiUrl, API_CONFIG } from '@/config/api';
import { getUserId } from '@/utils/userUtils';
import { createLogger } from '@/utils/logger';
import { withRetry } from '@/utils/retryUtils';
import { validateInput, transactionIdSchema, cpfSchema, telefoneSchema } from '@/schemas/validationSchemas';

const log = createLogger('comandoService');

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
  version?: string;
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
  cancel: boolean;
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

// ===== HELPER FUNCTIONS =====

/**
 * Parse RLIFUND error from response string
 */
function parseRlifundErrorString(responseString: string): RlifundErrorResponse | null {
  try {
    log.debug('Parsing RLIFUND error string:', responseString);
    
    // Extract JSON from format "400 - "{...}""
    const jsonMatch = responseString.match(/^[\d\s-]*"(.+)"$/);
    
    if (jsonMatch) {
      const jsonString = jsonMatch[1].replace(/\\"/g, '"');
      const parsed = JSON.parse(jsonString) as RlifundErrorResponse;
      log.debug('Parsed error response:', parsed);
      return parsed;
    }
    
    // Try direct parse if already JSON
    return JSON.parse(responseString) as RlifundErrorResponse;
  } catch (error) {
    log.error('Error parsing RLIFUND error:', error);
    return null;
  }
}

/**
 * Parse response text to JSON
 */
function parseResponseText(responseText: string, comando: string): any {
  log.debug(`[${comando}] Raw response text:`, responseText);
  
  try {
    const parsedData = JSON.parse(responseText);
    log.debug(`[${comando}] Parsed JSON data:`, parsedData);
    return parsedData;
  } catch (parseError) {
    log.error(`[${comando}] JSON parse error:`, parseError);
    throw new Error(`Failed to parse JSON response: ${parseError.message}`);
  }
}

/**
 * Normalize response to array format (adaptive parsing)
 */
function normalizeToArray(parsedData: any, comando: string): ComandoResponse {
  if (Array.isArray(parsedData)) {
    log.debug(`[${comando}] Response is already an array`);
    return parsedData;
  } else if (parsedData && typeof parsedData === 'object') {
    log.debug(`[${comando}] Response is an object, converting to array`);
    return [parsedData];
  } else {
    log.error(`[${comando}] Unexpected response format:`, parsedData);
    throw new Error(`Unexpected response format: expected object or array`);
  }
}

/**
 * Validate response structure
 */
function validateResponse(data: ComandoResponse, comando: string): void {
  log.debug(`[${comando}] Validating response structure`);
  
  if (!Array.isArray(data)) {
    throw new Error('Response is not an array');
  }
  
  if (!data[0]) {
    throw new Error('Response array is empty');
  }
  
  if (!data[0].response) {
    throw new Error('Response does not contain response field');
  }
}

/**
 * Handle string response (potential error format)
 */
function handleStringResponse(data: ComandoResponse, comando: string, requestBody: any): void {
  if (typeof data[0].response === 'string') {
    log.warn(`[${comando}] Response is string, checking for errors:`, data[0].response);
    
    const errorData = parseRlifundErrorString(data[0].response);
    if (errorData && !errorData.success && errorData.errors?.length > 0) {
      const firstError = errorData.errors[0];
      log.error(`[${comando}] Error detected:`, errorData);
      
      throw new RlifundApiError(
        firstError.code,
        firstError.message,
        requestBody,
        data[0]
      );
    }
    
    throw new Error(`Unexpected string response format: ${data[0].response}`);
  }
}

/**
 * Validate success status
 */
function validateSuccess(data: ComandoResponse, comando: string): void {
  if (data[0].response.success !== true) {
    throw new Error(`Response indicates failure: success=${data[0].response.success}`);
  }
}

/**
 * Execute comando request (generic function for all commands)
 */
async function executeComandoRequest(
  requestBody: any,
  comando: string,
  options?: {
    timeout?: number;
    validateStringResponse?: boolean;
    customValidation?: (data: ComandoResponse) => void;
    enableRetry?: boolean;
  }
): Promise<ComandoResponse> {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User ID not found in localStorage. Please login again.');
  }

  const timeout = options?.timeout || 30000;
  const url = buildApiUrl('comando?=');
  
  log.info(`Sending command ${comando}:`, requestBody);
  log.debug(`URL: ${url}`);
  log.debug(`User ID: ${userId}`);
  
  // Main request function
  const makeRequest = async (): Promise<ComandoResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
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
      
      log.debug(`[${comando}] Response status: ${response.status}`);
      
      if (!response.ok) {
        const error: any = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      
      const responseText = await response.text();
      const parsedData = parseResponseText(responseText, comando);
      const data = normalizeToArray(parsedData, comando);
      
      validateResponse(data, comando);
      
      // Handle string response (potential error)
      if (options?.validateStringResponse !== false) {
        handleStringResponse(data, comando, requestBody);
      }
      
      // Validate success
      validateSuccess(data, comando);
      
      // Custom validation if provided
      if (options?.customValidation) {
        options.customValidation(data);
      }
      
      log.info(`[${comando}] Request successful`);
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        log.error(`[${comando}] Request timeout`);
        throw new Error('TIMEOUT');
      }
      
      log.error(`[${comando}] Request error:`, error);
      throw error;
    }
  };
  
  // Use retry logic if enabled (default: true for most commands)
  if (options?.enableRetry !== false) {
    return withRetry(makeRequest, {
      maxAttempts: 3,
      initialDelay: 1000,
      onRetry: (attempt, error) => {
        log.warn(`[${comando}] Retry attempt ${attempt} after error:`, error);
      }
    });
  }
  
  return makeRequest();
}

// ===== SERVICE METHODS =====

export const comandoService = {
  async enviarComando(comando: string, cpf: string, version?: string): Promise<ComandoResponse> {
    // Validate CPF
    const cpfValidation = validateInput(cpfSchema, cpf);
    if (!cpfValidation.success) {
      throw new Error(`CPF inválido: ${'error' in cpfValidation ? cpfValidation.error : 'Erro desconhecido'}`);
    }
    
    const requestBody: ComandoRequest = {
      comando,
      cpf: cpfValidation.data,
      ...(version && { version })
    };
    
    return executeComandoRequest(requestBody, comando);
  },

  async enviarComandoRlicell(telefone: string, transactionId: string): Promise<ComandoResponse> {
    // Validate phone number
    const phoneValidation = validateInput(telefoneSchema, telefone);
    if (!phoneValidation.success) {
      throw new Error(`Telefone inválido: ${'error' in phoneValidation ? phoneValidation.error : 'Erro desconhecido'}`);
    }
    
    // Validate transaction ID
    const txValidation = validateInput(transactionIdSchema, transactionId);
    if (!txValidation.success) {
      throw new Error(`Transaction ID inválido: ${'error' in txValidation ? txValidation.error : 'Erro desconhecido'}`);
    }
    
    const requestBody: ComandoRlicellRequest = {
      comando: "RLICELL",
      telefone: phoneValidation.data,
      id_transaction: txValidation.data
    };
    
    return executeComandoRequest(requestBody, "RLICELL");
  },

  async enviarComandoRlifund(
    transactionId: string, 
    paymentOptionType: string, 
    valueTotal: string, 
    items: RlifundItem[]
  ): Promise<ComandoResponse> {
    const requestBody: ComandoRlifundRequest = {
      comando: "RLIFUND",
      id_transaction: transactionId,
      payment_option_type: paymentOptionType,
      value_total: valueTotal,
      items
    };
    
    log.info(`Sending RLIFUND with ${items.length} items, total: ${valueTotal}`);
    return executeComandoRequest(requestBody, "RLIFUND");
  },

  async enviarComandoRlidealUatV1(
    transactionId: string, 
    order: ComandoRlidealUatV1Request['order'], 
    useProductDz: number = 1
  ): Promise<ComandoResponse> {
    const requestBody: ComandoRlidealUatV1Request = {
      comando: "RLIDEAL",
      id_transaction: transactionId,
      use_product_dz: useProductDz,
      order
    };
    
    log.info(`Sending RLIDEAL UAT V1 with ${order.items.length} items`);
    return executeComandoRequest(requestBody, "RLIDEAL");
  },

  async enviarComandoRlideal(
    transactionId: string, 
    paymentOption: string, 
    version?: string
  ): Promise<ComandoResponse> {
    const requestBody: ComandoRlidealRequest = {
      comando: 'RLIDEAL',
      payment_option: paymentOption,
      id_transaction: transactionId,
      ...(version && { version })
    };
    
    return executeComandoRequest(requestBody, 'RLIDEAL');
  },

  async enviarComandoRliauth(transactionId: string, token: string): Promise<ComandoResponse> {
    const requestBody: ComandoRliauthRequest = {
      comando: 'RLIAUTH',
      id_transaction: transactionId,
      token: token,
      cancel: false
    };
    
    return executeComandoRequest(requestBody, 'RLIAUTH', {
      customValidation: (data) => {
        // Special validation for RLIAUTH - handle token validation messages
        const responseData = data[0].response.data;
        if (responseData) {
          const messageId = responseData.message?.id;
          const messageContent = responseData.message?.content || '';
          const nextStep = responseData.next_step?.[0]?.description;

          log.debug(`RLIAUTH Message ID: ${messageId}`);
          log.debug(`RLIAUTH Message Content: ${messageContent}`);
          log.debug(`RLIAUTH Next Step: ${nextStep}`);

          // For messageId 1001 (recoverable) or 1002 (fatal): log only, let component handle via ValidationModal
          if (messageId === 1001) {
            log.info('Invalid token (recoverable) - messageId 1001');
          } else if (messageId === 1002) {
            log.info('Invalid token (fatal) - messageId 1002');
          }
        }
      }
    });
  },

  async enviarComandoRlipays(transactionId: string, payments?: PaymentItem[]): Promise<ComandoResponse> {
    const requestBody: ComandoRlipaysRequest = {
      comando: 'RLIPAYS',
      id_transaction: transactionId,
      ...(payments && payments.length > 0 && { payments })
    };
    
    if (payments) {
      log.info(`Sending RLIPAYS with ${payments.length} payment(s)`);
    }
    
    return executeComandoRequest(requestBody, 'RLIPAYS');
  },

  async enviarComandoRliwait(transactionId: string, cancel: boolean = false): Promise<ComandoResponse> {
    const requestBody: ComandoRliwaitRequest = {
      comando: 'RLIWAIT',
      id_transaction: transactionId,
      cancel: cancel
    };
    
    return executeComandoRequest(requestBody, 'RLIWAIT');
  },

  async enviarComandoRliquit(transactionId: string): Promise<ComandoResponse> {
    const requestBody: ComandoRliquitRequest = {
      comando: 'RLIQUIT',
      id_transaction: transactionId
    };
    
    return executeComandoRequest(requestBody, 'RLIQUIT');
  },
};
