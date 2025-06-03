
export const API_CONFIG = {
  baseUrl: 'https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV',
  apiKey: '0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975',
  defaultHeaders: {
    'Content-Type': 'application/json',
    'x-api-key': '0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975'
  }
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string>) => {
  console.log(`[buildApiUrl] Endpoint recebido: "${endpoint}"`);
  console.log(`[buildApiUrl] Params recebidos:`, params);
  console.log(`[buildApiUrl] Base URL: "${API_CONFIG.baseUrl}"`);
  
  // Remove leading slash from endpoint if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  console.log(`[buildApiUrl] Clean endpoint: "${cleanEndpoint}"`);
  
  // Construir a URL completa usando concatenação manual para preservar o path
  let url = `${API_CONFIG.baseUrl}/${cleanEndpoint}`;
  
  // Adicionar parâmetros se existirem
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    url = `${url}?${searchParams.toString()}`;
  }
  
  console.log(`[buildApiUrl] URL final construída: "${url}"`);
  return url;
};
