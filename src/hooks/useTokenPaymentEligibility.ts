
import { useState, useEffect } from "react";
import { consultaFluxoService } from "@/services/consultaFluxoService";

export const useTokenPaymentEligibility = () => {
  const [showTokenPaymentButton, setShowTokenPaymentButton] = useState(false);
  const [tokenButtonLoading, setTokenButtonLoading] = useState(true);

  useEffect(() => {
    const checkTokenPaymentEligibility = async () => {
      try {
        setTokenButtonLoading(true);
        
        const cpf = localStorage.getItem('cpfDigitado');
        
        if (!cpf) {
          console.error('CPF não encontrado para verificação de pagamento por token.');
          setShowTokenPaymentButton(false);
          return;
        }
        
        console.log("Verificando elegibilidade para pagamento com token usando consultaFluxoService");
        
        const data = await consultaFluxoService.consultarFluxo(cpf, 'RLIWAIT');
        const canUseToken = data.permitir_pagamento_token === true;
        setShowTokenPaymentButton(canUseToken);
        
        console.log(`permitir_pagamento_token = ${canUseToken ? 'true ➝ Botão exibido' : 'false ➝ Botão oculto'}`);
        
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
