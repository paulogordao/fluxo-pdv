
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PdvLayout from "@/components/PdvLayout";
import PaymentOptionButton from "@/components/payment/PaymentOptionButton";
import TechnicalDocumentation from "@/components/technical/TechnicalDocumentation";
import { usePaymentOptions } from "@/hooks/usePaymentOptions";

const MeiosDePagamentoScreen = () => {
  const [selectedOption, setSelectedOption] = useState("app");
  const navigate = useNavigate();
  
  // Always load documentation when the component mounts
  const [documentationSlug, setDocumentationSlug] = useState("RLIFUNDRLIDEAL");
  
  // State for the alert dialog
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  
  const { paymentOptions, paymentOptionsLoading } = usePaymentOptions();
  
  // Handle option selection
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    
    // If "app" option is selected, navigate
    if (option === "app") {
      navigate('/confirmacao_pagamento_app');
    }
    
    // If "livelo" option (option 2) is selected, show the alert dialog
    if (option === "livelo") {
      setShowAlertDialog(true);
    }
  };
  
  // Handle confirmation from the alert dialog
  const handleAlertConfirm = () => {
    setShowAlertDialog(false);
    
    // If "livelo" option was selected, navigate to OTP data nascimento screen
    if (selectedOption === "livelo") {
      navigate('/otp_data_nascimento');
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
          
          {/* Technical documentation section - Always render with the fixed slug */}
          <TechnicalDocumentation 
            slug={documentationSlug} 
            loadOnMount={true} 
          />
          
          {/* Alert Dialog for Option 2 - Styled to match /interesse_pagamento modal */}
          <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
            <AlertDialogContent className="max-w-md mx-auto p-0 overflow-hidden">
              <AlertDialogHeader className="bg-dotz-laranja p-4 text-white mb-4">
                <AlertDialogTitle className="text-center">
                  Atenção!!!
                </AlertDialogTitle>
              </AlertDialogHeader>
              
              <div className="p-4 text-center">
                <AlertDialogDescription className="text-base">
                  <p className="mb-3">
                    Na chamada do serviço RLIDEAL é retornado a variável <span className="font-mono font-medium">otp_payment_enabled</span>.
                  </p>
                  <p>
                    Quando <span className="font-bold">TRUE</span>, é necessário solicitar uma autenticação do cliente (token, data de nascimento, etc).
                  </p>
                </AlertDialogDescription>
              </div>
              
              <AlertDialogFooter className="p-4 justify-center">
                <AlertDialogAction 
                  className="min-w-[120px] bg-dotz-laranja hover:bg-dotz-laranja/90"
                  onClick={handleAlertConfirm}
                >
                  OK
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </PdvLayout>
  );
};

export default MeiosDePagamentoScreen;
