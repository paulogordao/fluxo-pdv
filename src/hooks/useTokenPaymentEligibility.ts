import { useState, useEffect } from "react";
import { consultaFluxoService } from "@/services/consultaFluxoService";
import { createLogger } from "@/utils/logger";

const log = createLogger('useTokenPaymentEligibility');

export const useTokenPaymentEligibility = () => {
  const [showTokenPaymentButton, setShowTokenPaymentButton] = useState(false);
  const [tokenButtonLoading, setTokenButtonLoading] = useState(true);

  useEffect(() => {
    const checkTokenPaymentEligibility = () => {
      try {
        setTokenButtonLoading(true);
        
        log.debug("Verificando elegibilidade para pagamento com token usando resposta RLIDEAL");
        
        // Get RLIDEAL response from localStorage
        const rlidealResponseStr = localStorage.getItem('rlidealResponse');
        
        if (!rlidealResponseStr) {
          log.info('Resposta RLIDEAL não encontrada no localStorage ➝ Botão oculto');
          setShowTokenPaymentButton(false);
          return;
        }
        
        try {
          const rlidealResponse = JSON.parse(rlidealResponseStr);
          const otpPaymentEnabled = rlidealResponse[0]?.response?.data?.otp_payment_enabled === true;
          setShowTokenPaymentButton(otpPaymentEnabled);
          
          log.debug(`otp_payment_enabled = ${otpPaymentEnabled ? 'true ➝ Botão exibido' : 'false ➝ Botão oculto'}`);
          
        } catch (parseError) {
          log.error("Erro ao fazer parse da resposta RLIDEAL:", parseError);
          setShowTokenPaymentButton(false);
        }
        
      } catch (error) {
        log.error("Error checking token payment eligibility:", error);
        setShowTokenPaymentButton(false);
      } finally {
        setTokenButtonLoading(false);
      }
    };
    
    checkTokenPaymentEligibility();
  }, []);

  return {
    showTokenPaymentButton,
    tokenButtonLoading
  };
};
