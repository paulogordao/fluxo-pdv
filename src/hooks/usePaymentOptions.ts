
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";

interface PaymentOptionsResponse {
  possui_dotz?: boolean;
  outros_meios_pagamento?: boolean;
  dotz_sem_app?: boolean;
  SLUG?: string;
}

interface ApiDataResponse {
  request_servico?: string;
  response_servico_anterior?: string;
}

export const usePaymentOptions = () => {
  const navigate = useNavigate();
  // Payment options state
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptionsResponse>({});
  const [paymentOptionsLoading, setPaymentOptionsLoading] = useState(true);
  
  // API integration states for technical documentation
  const [apiData, setApiData] = useState<ApiDataResponse>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch payment options with stored CPF
  useEffect(() => {
    const fetchPaymentOptions = async () => {
      try {
        // Get stored CPF from localStorage
        const cpf = localStorage.getItem('cpfDigitado');
        
        // Fallback if CPF is not available
        if (!cpf) {
          console.error('CPF não encontrado. Redirecionando para a etapa de identificação.');
          toast.error("CPF não encontrado");
          navigate('/cpf');
          return;
        }
        
        // Using the correct SLUG value: RLIFUND instead of RLFUND
        const url = `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/consultaFluxo?cpf=${cpf}&SLUG=RLIFUND`;
        console.log("Fetching payment options data:", url);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error in request: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Payment options data:", data);
        setPaymentOptions(data);
      } catch (error) {
        console.error("Error fetching payment options:", error);
        toast.error("Erro ao carregar opções de pagamento");
      } finally {
        setPaymentOptionsLoading(false);
      }
    };
    
    fetchPaymentOptions();
  }, [navigate]);

  // Fetch API data for technical documentation (fixed SLUG)
  useEffect(() => {
    const fetchApiData = async () => {
      try {
        const fixedSlug = "RLIFUNDRLIDEAL";
        const url = `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/consultaFluxoDetalhe?SLUG=${fixedSlug}`;
        console.log("Fetching API details:", url);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error in request: ${response.status}`);
        }
        
        const data = await response.json();
        setApiData(data);
        console.log("API data:", data);
      } catch (error) {
        console.error("Error fetching API data:", error);
        toast.error("Erro ao carregar detalhes");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApiData();
  }, []);

  return {
    paymentOptions,
    paymentOptionsLoading,
    apiData,
    isLoading
  };
};
