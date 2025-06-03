
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { consultaFluxoService, ConsultaFluxoResponse } from "@/services/consultaFluxoService";

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
          console.error('CPF não encontrado. Redirecionando para a etapa de identificação.');
          toast.error("CPF não encontrado");
          navigate('/cpf');
          return;
        }
        
        // Using the correct SLUG value: RLIFUND instead of RLFUND
        console.log("Fetching payment options data...");
        const data = await consultaFluxoService.consultarFluxo(cpf, 'RLIFUND');
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
