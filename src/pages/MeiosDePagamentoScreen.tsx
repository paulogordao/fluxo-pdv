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
import { useUserSession } from "@/hooks/useUserSession";
import ErrorModal from "@/components/ErrorModal";
import { comandoService, RlifundApiError } from "@/services/comandoService";
import { Loader2 } from "lucide-react";
import EncerrarAtendimentoButton from "@/components/EncerrarAtendimentoButton";

const MeiosDePagamentoScreen = () => {
  const [selectedOption, setSelectedOption] = useState("app");
  const navigate = useNavigate();
  const { setSelectedPaymentOption } = usePaymentOption();
  const sessionData = useUserSession();
  
  // Função para determinar a versão baseada no tipo de simulação
  const getVersionFromTipo = (tipo_simulacao?: string): string | undefined => {
    if (tipo_simulacao === "Versão 1") return "1";
    if (tipo_simulacao === "Versão 2") return "2";
    return undefined;
  };
  
  // Always load documentation when the component mounts
  const [documentationSlug, setDocumentationSlug] = useState("RLIFUNDRLIDEAL");
  
  // State for the alert dialogs
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showDotzAlertDialog, setShowDotzAlertDialog] = useState(false);
  const [showDotzConfirmDialog, setShowDotzConfirmDialog] = useState(false);
  
  // State for RLIDEAL API call
  const [isLoadingRlideal, setIsLoadingRlideal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  // State for technical data
  const [technicalRequestData, setTechnicalRequestData] = useState<string | undefined>();
  const [technicalResponseData, setTechnicalResponseData] = useState<string | undefined>();
  const [technicalPreviousRequestData, setTechnicalPreviousRequestData] = useState<string | undefined>();
  
  // Check if RLIFUND data exists to determine which hooks to use
  const rlifundResponse = localStorage.getItem('rlifundResponse');
  const hasRlifundData = rlifundResponse ? (() => {
    try {
      const parsed = JSON.parse(rlifundResponse);
      return Array.isArray(parsed) && parsed[0]?.response?.data?.payment_options;
    } catch {
      return false;
    }
  })() : false;

  // Conditionally call hooks based on data availability
  const { paymentOptions: fundPaymentOptions, loading: fundLoading, isOnlineMode } = useFundPaymentOptions();
  const { paymentOptions: legacyPaymentOptions, paymentOptionsLoading: legacyLoading } = hasRlifundData ? 
    { paymentOptions: {}, paymentOptionsLoading: false } : usePaymentOptions();
  
  // Determine which data source to use based on mode
  const paymentOptionsLoading = isOnlineMode ? fundLoading : legacyLoading;
  const currentPaymentOptions = isOnlineMode ? fundPaymentOptions : null;

  // Load technical data from localStorage and generate dynamic request data
  useEffect(() => {
    // Load RLFUND response from localStorage (from previous screen)
    const rlifundResponse = localStorage.getItem('rlifundResponse');
    if (rlifundResponse) {
      try {
        const parsedData = JSON.parse(rlifundResponse);
        if (Array.isArray(parsedData) && parsedData[0]) {
          // Request do serviço anterior (RLIFUND)
          if (parsedData[0].request) {
            setTechnicalPreviousRequestData(JSON.stringify(parsedData[0].request, null, 2));
          }
          // Response do serviço anterior (RLIFUND)
          if (parsedData[0].response) {
            setTechnicalResponseData(JSON.stringify(parsedData[0].response, null, 2));
          }
        }
      } catch (error) {
        console.error('Erro ao parsear rlifundResponse:', error);
        // Fallback to raw data if parsing fails
        setTechnicalResponseData(rlifundResponse);
      }
    }

    // Generate RLIDEAL request data based on current state
    const transactionId = localStorage.getItem('transactionId');
    if (transactionId) {
      const requestData = {
        route: "RLIDEAL",
        version: 1,
        input: {
          transaction_id: transactionId,
          payment_option_type: selectedOption || "default"
        }
      };
      setTechnicalRequestData(JSON.stringify(requestData, null, 2));
    }
  }, [selectedOption]);

  // Monitor localStorage changes for RLFUND response
  useEffect(() => {
    const handleStorageChange = () => {
      const rlifundResponse = localStorage.getItem('rlifundResponse');
      if (rlifundResponse) {
        try {
          const parsedData = JSON.parse(rlifundResponse);
          if (Array.isArray(parsedData) && parsedData[0]) {
            // Request do serviço anterior (RLIFUND)
            if (parsedData[0].request) {
              setTechnicalPreviousRequestData(JSON.stringify(parsedData[0].request, null, 2));
            }
            // Response do serviço anterior (RLIFUND)
            if (parsedData[0].response) {
              setTechnicalResponseData(JSON.stringify(parsedData[0].response, null, 2));
            }
          }
        } catch (error) {
          console.error('Erro ao parsear rlifundResponse:', error);
          // Fallback to raw data if parsing fails
          setTechnicalResponseData(rlifundResponse);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Handle option selection
  const handleOptionSelect = async (option: string) => {
    setSelectedOption(option);
    setSelectedPaymentOption(option as any);
    
    console.log(`Opção selecionada: ${option === "app" ? "1" : option === "livelo" ? "2" : option === "dotz" ? "3" : "4"} – Aplicando valores na confirmação.`);
    
    // If in ONLINE mode, call RLIDEAL service first
    if (isOnlineMode) {
      await handleRlidealCall(option);
      return;
    }
    
    // OFFLINE mode - use existing logic
    handleOfflineNavigation(option);
  };

  // Handle RLIDEAL API call for ONLINE mode
  const handleRlidealCall = async (option: string) => {
    const transactionId = localStorage.getItem('transactionId');
    if (!transactionId) {
      console.error('Transaction ID não encontrado');
      navigate('/cpf');
      return;
    }

    setIsLoadingRlideal(true);
    
    // Determinar a versão baseada no tipo de simulação
    const version = getVersionFromTipo(sessionData?.tipo_simulacao);
    
    console.log(`[DEBUG] tipo_simulacao: ${sessionData?.tipo_simulacao}`);
    console.log(`[DEBUG] version detectada: ${version}`);
    console.log(`[DEBUG] option recebida: "${option}"`);
    console.log(`[DEBUG] Condição none+v2: ${option === "none" && version === "2"}`);
    
    // Mapear "none" para string vazia apenas na versão 2
    let paymentOptionValue = option;
    if (option === "none" && version === "2") {
      paymentOptionValue = "";
      console.log(`[DEBUG] ✅ Mapeamento executado: "none" → ""`);
    } else {
      console.log(`[DEBUG] ❌ Mapeamento NÃO executado`);
    }
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 30000);
      });

      console.log(`[MeiosDePagamentoScreen] Enviando RLIDEAL com versão: ${version} (tipo_simulacao: ${sessionData?.tipo_simulacao})`);
      console.log(`[MeiosDePagamentoScreen] Opção original: ${option}, Valor enviado: ${paymentOptionValue}`);
      
      const response = await Promise.race([
        comandoService.enviarComandoRlideal(transactionId, paymentOptionValue, version),
        timeoutPromise
      ]) as any;

      console.log('[MeiosDePagamentoScreen] RLIDEAL response:', response);
      
      // Store RLIDEAL response
      localStorage.setItem('rlidealResponse', JSON.stringify(response));

      // Navigate based on payment option and token requirements
      const tokenInfo = response[0]?.response?.data?.token;
      console.log('[MeiosDePagamentoScreen] Token info:', tokenInfo);
      if (tokenInfo?.required === true && tokenInfo?.type?.toLowerCase() === 'birthdate') {
        console.log('[MeiosDePagamentoScreen] Redirecting to /otp_data_nascimento for birthdate token');
        navigate('/otp_data_nascimento');
      } else if (tokenInfo?.required === true && tokenInfo?.type?.toLowerCase() === 'otp') {
        console.log('[MeiosDePagamentoScreen] Redirecting to /confirmacao_pagamento_token for OTP token');
        navigate('/confirmacao_pagamento_token');
      } else if (option === "app") {
        console.log('[MeiosDePagamentoScreen] Redirecting to /confirmacao_pagamento_app for app option');
        navigate('/confirmacao_pagamento_app');
      } else {
        // Default navigation for other cases
        navigate('/confirmacao_pagamento');
      }

    } catch (error: any) {
      console.error('[MeiosDePagamentoScreen] Erro RLIDEAL:', error);
      
      let errorCode = 'RLIDEAL_ERROR';
      let errorMessage = "Erro ao processar opção de pagamento. Tente novamente.";
      let technicalError = error.message;
      let fullRequest = {
        method: 'RLIDEAL',
        transactionId: transactionId,
        paymentOption: option
      };
      let fullResponse = error;
      
      if (error.message === 'TIMEOUT') {
        errorCode = 'TIMEOUT';
        errorMessage = "Timeout: O serviço não respondeu em tempo hábil (30s)";
        technicalError = "Timeout após 30 segundos - serviço indisponível";
      } else if (error.constructor.name === 'RlifundApiError') {
        // Handle structured RLIDEAL API errors (reusing RlifundApiError class)
        errorCode = error.code;
        errorMessage = error.message;
        fullRequest = error.fullRequest;
        fullResponse = error.fullResponse;
      } else if (error.message.includes('HTTP error')) {
        const statusMatch = error.message.match(/status: (\d+)/);
        const status = statusMatch ? statusMatch[1] : 'desconhecido';
        errorMessage = `Erro HTTP ${status}: Problema no servidor`;
        technicalError = `HTTP ${status} - ${error.message}`;
      } else if (error.message.includes('fetch')) {
        errorMessage = "Erro de rede: Verifique sua conexão";
        technicalError = "Erro de conectividade - " + error.message;
      }

      setErrorDetails({
        code: errorCode,
        message: errorMessage,
        technicalMessage: technicalError,
        request: fullRequest,
        fullError: fullResponse
      });
      setShowErrorModal(true);
    } finally {
      setIsLoadingRlideal(false);
    }
  };

  // Handle navigation for OFFLINE mode
  const handleOfflineNavigation = (option: string) => {
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

  // Handle retry for RLIDEAL call
  const handleRetryRlideal = () => {
    setShowErrorModal(false);
    setErrorDetails(null);
    if (selectedOption) {
      handleRlidealCall(selectedOption);
    }
  };

  return (
    <PdvLayout>
      {/* Fixed position button outside the Card */}
      <div className="fixed bottom-6 right-6 z-50">
        <EncerrarAtendimentoButton />
      </div>

      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md p-8 relative">
          {/* Loading Overlay for RLIDEAL call */}
          {isLoadingRlideal && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-dotz-laranja mb-2" />
              <p className="text-sm font-medium text-gray-600">Processando opção de pagamento...</p>
            </div>
          )}
          
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Escolha a forma de pagamento
              </h1>
            </div>
            <p className="text-center text-gray-600 mb-6">
              Como você gostaria de pagar?
            </p>

            <div className="w-full space-y-4">
              {paymentOptionsLoading ? (
                // Show loading skeletons when loading
                <>
                  <div className="h-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-12 bg-gray-200 rounded animate-pulse" />
                </>
              ) : isOnlineMode && currentPaymentOptions ? (
                // Show dynamic options from FUND response when in ONLINE mode
                currentPaymentOptions.map((option) => (
                  <PaymentOptionButton
                    key={option.id}
                    selected={selectedOption === option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    label={option.label}
                  />
                ))
              ) : (
                // Show default options when in OFFLINE mode or when no FUND data
                <>
                  <PaymentOptionButton
                    selected={selectedOption === "app"}
                    onClick={() => handleOptionSelect("app")}
                    label="Pagar pelo App"
                  />
                  <PaymentOptionButton
                    selected={selectedOption === "livelo"}
                    onClick={() => handleOptionSelect("livelo")}
                    label="Livelo"
                  />
                  <PaymentOptionButton
                    selected={selectedOption === "dotz"}
                    onClick={() => handleOptionSelect("dotz")}
                    label="Dotz"
                  />
                  <PaymentOptionButton
                    selected={selectedOption === "none"}
                    onClick={() => handleOptionSelect("none")}
                    label="Não desejo usar nenhum programa"
                  />
                </>
              )}
            </div>
          </div>
        </Card>
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

      {/* Error Modal for RLIDEAL */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onRetry={handleRetryRlideal}
        errorCode={errorDetails?.code}
        errorMessage={errorDetails?.message}
        fullRequest={errorDetails?.request}
        fullResponse={errorDetails?.fullError}
        apiType="RLIDEAL"
      />

      <TechnicalFooter
        requestData={technicalRequestData}
        responseData={technicalResponseData}
        previousRequestData={technicalPreviousRequestData}
        isLoading={isLoadingRlideal}
        slug={documentationSlug}
        loadOnMount={false}
        sourceScreen="meios_de_pagamento"
      />
    </PdvLayout>
  );
};

export default MeiosDePagamentoScreen;