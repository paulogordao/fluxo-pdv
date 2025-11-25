import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { consultaFluxoService, ConsultaFluxoResponse } from "@/services/consultaFluxoService";
import { createLogger } from "@/utils/logger";
import { validateInput, cpfSchema } from "@/schemas/validationSchemas";
import { getUserFriendlyError } from "@/utils/errorUtils";

const log = createLogger('usePaymentOptions');

export const usePaymentOptions = () => {
  const navigate = useNavigate();
  // Payment options state
  const [paymentOptions, setPaymentOptions] = useState<ConsultaFluxoResponse>({});
  const [paymentOptionsLoading, setPaymentOptionsLoading] = useState(true);

  // Memoized fetch function
  const fetchPaymentOptions = useCallback(async () => {
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
      
      // Validate CPF
      const validation = validateInput(cpfSchema, cpf);
      if (!validation.success) {
        // Access error safely
        log.error('CPF inválido:', 'error' in validation ? validation.error : 'Erro desconhecido');
        toast.error('error' in validation ? validation.error : 'CPF inválido');
        navigate('/cpf');
        return;
      }
      
      // Using the correct SLUG value: RLIFUND instead of RLFUND
      log.debug("Fetching payment options data...");
      const data = await consultaFluxoService.consultarFluxo(validation.data, 'RLIFUND');
      log.debug("Payment options data:", data);
      setPaymentOptions(data);
    } catch (error) {
      log.error("Error fetching payment options:", error);
      const enhancedError = getUserFriendlyError(error, 'Carregar opções de pagamento');
      toast.error(enhancedError.context?.userMessage || "Erro ao carregar opções de pagamento", {
        description: enhancedError.context?.suggestion
      });
    } finally {
      setPaymentOptionsLoading(false);
    }
  }, [navigate]);
  
  // Fetch payment options with stored CPF
  useEffect(() => {
    fetchPaymentOptions();
  }, [fetchPaymentOptions]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    paymentOptions,
    paymentOptionsLoading,
    refetch: fetchPaymentOptions
  }), [paymentOptions, paymentOptionsLoading, fetchPaymentOptions]);
};
