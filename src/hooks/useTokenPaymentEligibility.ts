
import { useState, useEffect } from "react";
import { buildApiUrl, API_CONFIG } from "@/config/api";

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
        
        const url = buildApiUrl('/consultaFluxo', { cpf, SLUG: 'RLIWAIT' });
        console.log("Verificando elegibilidade para pagamento com token:", url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: API_CONFIG.defaultHeaders
        });
        
        if (!response.ok) {
          throw new Error(`Error in token eligibility request: ${response.status}`);
        }
        
        const data = await response.json();
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
