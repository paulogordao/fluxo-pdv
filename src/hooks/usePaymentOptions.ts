
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";

interface PaymentOptionsResponse {
  possui_dotz?: boolean;
  outros_meios_pagamento?: boolean;
  dotz_sem_app?: boolean;
  SLUG?: string;
}

export const usePaymentOptions = () => {
  const navigate = useNavigate();
  // Payment options state
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptionsResponse>({});
  const [paymentOptionsLoading, setPaymentOptionsLoading] = useState(true);

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

  return {
    paymentOptions,
    paymentOptionsLoading
  };
};
