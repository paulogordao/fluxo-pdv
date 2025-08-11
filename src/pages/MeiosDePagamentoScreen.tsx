
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PdvLayout from "@/components/PdvLayout";
import PaymentOptionButton from "@/components/payment/PaymentOptionButton";
import TechnicalFooter from "@/components/TechnicalFooter";
import { usePaymentOptions } from "@/hooks/usePaymentOptions";
import { useFundPaymentOptions } from "@/hooks/useFundPaymentOptions";
import { usePaymentOption } from "@/context/PaymentOptionContext";

const MeiosDePagamentoScreen = () => {
  const [selectedOption, setSelectedOption] = useState("app");
  const navigate = useNavigate();
  const { setSelectedPaymentOption } = usePaymentOption();
  
  // Always load documentation when the component mounts
  const [documentationSlug, setDocumentationSlug] = useState("RLIFUNDRLIDEAL");
  
  // State for the alert dialogs
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showDotzAlertDialog, setShowDotzAlertDialog] = useState(false);
  const [showDotzConfirmDialog, setShowDotzConfirmDialog] = useState(false);
  
  // Use the appropriate hook based on mode
  const { paymentOptions: legacyPaymentOptions, paymentOptionsLoading: legacyLoading } = usePaymentOptions();
  const { paymentOptions: fundPaymentOptions, loading: fundLoading, isOnlineMode } = useFundPaymentOptions();
  
  // Determine which data source to use
  const paymentOptionsLoading = isOnlineMode ? fundLoading : legacyLoading;
  const currentPaymentOptions = isOnlineMode ? fundPaymentOptions : null;
  
  // Handle option selection
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setSelectedPaymentOption(option as any);
    
    console.log(`Opção selecionada: ${option === "app" ? "1" : option === "livelo" ? "2" : option === "dotz" ? "3" : "4"} – Aplicando valores na confirmação.`);
    
    // If "app" option is selected, navigate
    if (option === "app") {
      navigate('/confirmacao_pagamento_app');
    }
    
    // If "livelo" or "outros_pagamentos" option (option 2) is selected, show the alert dialog
    if (option === "livelo" || option === "outros_pagamentos") {
      setShowAlertDialog(true);
    }
    
    // If "dotz" option (option 3) is selected, show the first dotz alert dialog
    if (option === "dotz") {
      setShowDotzAlertDialog(true);
    }
  };
  
  // Handle confirmation from the first alert dialog (Option 2 - Livelo)
  const handleAlertConfirm = () => {
    setShowAlertDialog(false);
    
    // If "livelo" or "outros_pagamentos" option was selected, navigate to OTP data nascimento screen
    if (selectedOption === "livelo" || selectedOption === "outros_pagamentos") {
      navigate('/otp_data_nascimento');
    }
  };

  // Handle confirmation from the first dotz alert dialog (Option 3 - Dotz)
  const handleDotzAlertConfirm = () => {
    setShowDotzAlertDialog(false);
    setShowDotzConfirmDialog(true);
  };

  // Handle confirmation from the second dotz dialog (Option 3 - Dotz)
  const handleDotzConfirmUse = () => {
    setShowDotzConfirmDialog(false);
    // Navigate to the confirmation page
    navigate('/confirmacao_pagamento');
  };

  // Handle cancel from the second dotz dialog (Option 3 - Dotz)
  const handleDotzConfirmCancel = () => {
    setShowDotzConfirmDialog(false);
    // No further action needed - just close the dialog
  };

  return (
    <PdvLayout className="pb-16">
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
                  {/* Online mode - Use dynamic payment options from FUND */}
                  {isOnlineMode && currentPaymentOptions ? (
                    currentPaymentOptions.map((option) => (
                      <PaymentOptionButton
                        key={option.id}
                        selected={selectedOption === option.id}
                        onClick={() => handleOptionSelect(option.id)}
                        label={option.label}
                      />
                    ))
                  ) : (
                    /* Offline mode - Use legacy behavior with static options */
                    <>
                      {/* App option - Show if possui_dotz is true */}
                      {legacyPaymentOptions.possui_dotz && (
                        <PaymentOptionButton
                          selected={selectedOption === "app"}
                          onClick={() => handleOptionSelect("app")}
                          label="1. Até R$68,93 no APP"
                        />
                      )}
                      
                      {/* Livelo option - Show if outros_meios_pagamento is true */}
                      {legacyPaymentOptions.outros_meios_pagamento && (
                        <PaymentOptionButton
                          selected={selectedOption === "livelo"}
                          onClick={() => handleOptionSelect("livelo")}
                          label="2. R$60 (Outros pagamentos) sem APP"
                        />
                      )}
                      
                      {/* Dotz option - Show if dotz_sem_app is true */}
                      {legacyPaymentOptions.dotz_sem_app && (
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
                </>
              )}
            </div>
          </div>
          
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
          
          {/* First Alert Dialog for Option 3 (Dotz) - Uses the same styling as Option 2 */}
          <AlertDialog 
            open={showDotzAlertDialog} 
            onOpenChange={setShowDotzAlertDialog}
          >
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
                  onClick={handleDotzAlertConfirm}
                >
                  OK
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Second Dialog for Option 3 (Dotz) - Confirmation dialog */}
          <Dialog 
            open={showDotzConfirmDialog} 
            onOpenChange={setShowDotzConfirmDialog}
          >
            <DialogContent className="max-w-md mx-auto p-0 overflow-hidden">
              <DialogHeader className="bg-dotz-laranja p-4 text-white mb-4">
                <DialogTitle className="text-center">
                  Confirmação
                </DialogTitle>
              </DialogHeader>
              
              <div className="p-6 text-center">
                <DialogDescription className="text-base text-black font-medium">
                  R$3 em Dotz.
                </DialogDescription>
              </div>
              
              <DialogFooter className="p-4 flex justify-center gap-4">
                <Button 
                  variant="cancel" 
                  className="min-w-[120px]"
                  onClick={handleDotzConfirmCancel}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="dotz" 
                  className="min-w-[120px]"
                  onClick={handleDotzConfirmUse}
                >
                  Usar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      
      {/* Technical Footer Component */}
      <TechnicalFooter
        slug={documentationSlug} 
        loadOnMount={true}
        sourceScreen="meios_de_pagamento"
      />
    </PdvLayout>
  );
};

export default MeiosDePagamentoScreen;
