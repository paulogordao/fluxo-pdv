import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { consultaFluxoService, ConsultaFluxoResponse } from "@/services/consultaFluxoService";
import { createLogger } from "@/utils/logger";

const log = createLogger('usePaymentOptions');

export const usePaymentOptions = () => {
  const navigate = useNavigate();
  // Payment options state
  const [paymentOptions, setPaymentOptions] = useState<ConsultaFluxoResponse>({});
  const [paymentOptionsLoading, setPaymentOptionsLoading] = useState(true);

  // Fetch payment options with stored CPF
  useEffect(() => {
    const fetchPaymentOptions = async () => {
      try {
        // Get stored CPF from localStorage
        const cpf = localStorage.getItem('cpfDigitado');
        
        // Fallback if CPF is not available
        if (!cpf) {
          log.error('CPF não encontrado. Redirecionando para a etapa de identificação.');
          toast.error("CPF não encontrado");
          navigate('/cpf');
          return;
        }
        
        // Using the correct SLUG value: RLIFUND instead of RLFUND
        log.debug("Fetching payment options data...");
        const data = await consultaFluxoService.consultarFluxo(cpf, 'RLIFUND');
        log.debug("Payment options data:", data);
        setPaymentOptions(data);
      } catch (error) {
        log.error("Error fetching payment options:", error);
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
