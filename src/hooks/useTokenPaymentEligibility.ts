
import { useState, useEffect } from "react";
import { consultaFluxoService } from "@/services/consultaFluxoService";

export const useTokenPaymentEligibility = () => {
  const [showTokenPaymentButton, setShowTokenPaymentButton] = useState(false);
  const [tokenButtonLoading, setTokenButtonLoading] = useState(true);

  useEffect(() => {
    const checkTokenPaymentEligibility = () => {
      try {
        setTokenButtonLoading(true);
        
        console.log("Verificando elegibilidade para pagamento com token usando resposta RLIDEAL");
        
        // Get RLIDEAL response from localStorage
        const rlidealResponseStr = localStorage.getItem('rlidealResponse');
        
        if (!rlidealResponseStr) {
          console.log('Resposta RLIDEAL não encontrada no localStorage ➝ Botão oculto');
          setShowTokenPaymentButton(false);
          return;
        }
        
        try {
          const rlidealResponse = JSON.parse(rlidealResponseStr);
          const otpPaymentEnabled = rlidealResponse[0]?.response?.data?.otp_payment_enabled === true;
          setShowTokenPaymentButton(otpPaymentEnabled);
          
          console.log(`otp_payment_enabled = ${otpPaymentEnabled ? 'true ➝ Botão exibido' : 'false ➝ Botão oculto'}`);
          
        } catch (parseError) {
          console.error("Erro ao fazer parse da resposta RLIDEAL:", parseError);
          setShowTokenPaymentButton(false);
        }
        
      } catch (error) {
        console.error("Error checking token payment eligibility:", error);
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
