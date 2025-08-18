export interface Transacao {
  id: number;
  created_at: string;
  transaction_id: string;
  servico: string;
  request: string;
  response: string;
}

export interface TransacaoResponse {
  data: Transacao[];
}

export interface TransacaoRequest {
  [key: string]: any;
}

export interface TransacaoResponseData {
  [key: string]: any;
}