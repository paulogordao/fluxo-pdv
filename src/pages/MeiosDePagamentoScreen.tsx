
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PdvLayout from "@/components/PdvLayout";
import PaymentOptionButton from "@/components/payment/PaymentOptionButton";
import TechnicalDocumentation from "@/components/technical/TechnicalDocumentation";
import { usePaymentOptions } from "@/hooks/usePaymentOptions";

const MeiosDePagamentoScreen = () => {
  const [selectedOption, setSelectedOption] = useState("app");
  const navigate = useNavigate();
  
  const { paymentOptions, paymentOptionsLoading, apiData, isLoading } = usePaymentOptions();
  
  // Handle option selection
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    
    // If "app" option is selected, navigate to the confirmation page
    if (option === "app") {
      navigate('/confirmacao_pagamento_app');
    }
  };

  return (
    <PdvLayout>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="bg-dotz-laranja text-white">
          <CardTitle className="text-center">
            Benefícios cliente A
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-4">
              Manoel, você quer pagar com seus pontos?
            </h3>
            
            <div className="space-y-3 mt-6">
              {/* Loading state */}
              {paymentOptionsLoading ? (
                <div className="py-4 text-center">Carregando opções de pagamento...</div>
              ) : (
                <>
                  {/* App option - Show if possui_dotz is true */}
                  {paymentOptions.possui_dotz && (
                    <PaymentOptionButton
                      selected={selectedOption === "app"}
                      onClick={() => handleOptionSelect("app")}
                      label="1. Até R$68,93 no APP"
                    />
                  )}
                  
                  {/* Livelo option - Show if outros_meios_pagamento is true */}
                  {paymentOptions.outros_meios_pagamento && (
                    <PaymentOptionButton
                      selected={selectedOption === "livelo"}
                      onClick={() => handleOptionSelect("livelo")}
                      label="2. R$60 (Outros pagamentos) sem APP"
                    />
                  )}
                  
                  {/* Dotz option - Show if dotz_sem_app is true */}
                  {paymentOptions.dotz_sem_app && (
                    <PaymentOptionButton
                      selected={selectedOption === "dotz"}
                      onClick={() => handleOptionSelect("dotz")}
                      label="3. R$3 (Dotz) sem APP"
                    />
                  )}
                  
                  {/* None option - Always show */}
                  <PaymentOptionButton
                    selected={selectedOption === "none"}
                    onClick={() => handleOptionSelect("none")}
                    label="4. Nenhum"
                  />
                </>
              )}
            </div>
          </div>
          
          {/* Technical documentation section */}
          <TechnicalDocumentation
            requestData={apiData.request_servico}
            responseData={apiData.response_servico_anterior}
            isLoading={isLoading}
            slug="RLIDEALRLIWAIT"
          />
        </CardContent>
      </Card>
    </PdvLayout>
  );
};

export default MeiosDePagamentoScreen;
