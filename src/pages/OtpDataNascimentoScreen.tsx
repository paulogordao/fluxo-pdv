import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import PdvLayout from "@/components/PdvLayout";
import TechnicalFooter from "@/components/TechnicalFooter";
import { comandoService, RlifundApiError } from "@/services/comandoService";
import ErrorModal from "@/components/ErrorModal";
import ValidationModal from "@/components/ValidationModal";
import { toast } from "sonner";

const OtpDataNascimentoScreen = () => {
  const [digits, setDigits] = useState<string[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [validationNextStep, setValidationNextStep] = useState("");
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const navigate = useNavigate();

  // Handle number input
  const handleNumberClick = (num: string) => {
    if (digits.length < 8) {
      setDigits(prev => [...prev, num]);
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    if (digits.length > 0) {
      setDigits(prev => prev.slice(0, -1));
    }
  };

  // Handle enter button
  const handleEnter = async () => {
    if (digits.length === 8 && !isLoadingAuth) {
      setIsLoadingAuth(true);
      
      try {
        // Get transaction ID from localStorage
        const transactionId = localStorage.getItem('transactionId');
        if (!transactionId) {
          toast.error("Sessão expirada. Redirecionando...");
          navigate('/');
          return;
        }

        // Send RLIAUTH command with the numeric token (no formatting)
        const numericToken = digits.join('');
        console.log('[OtpDataNascimentoScreen] Sending RLIAUTH with token:', numericToken);
        
        const response = await comandoService.enviarComandoRliauth(transactionId, numericToken);
        console.log('[OtpDataNascimentoScreen] RLIAUTH Response:', response);

        // Check if there's a system message to show the user
        const systemMessage = response?.[0]?.response?.data?.message?.content;
        const nextStep = response?.[0]?.response?.data?.next_step?.[0]?.description;
        
        if (systemMessage) {
          console.log('[OtpDataNascimentoScreen] System message found:', systemMessage);
          console.log('[OtpDataNascimentoScreen] Next step:', nextStep);
          setValidationMessage(systemMessage);
          setValidationNextStep(nextStep || "");
          setShowValidationModal(true);
          return;
        }

        // Store response in localStorage for next screen
        localStorage.setItem('rliauthResponse', JSON.stringify(response));
        
        // Navigate to confirmation page with state indicating where we're coming from
        navigate("/confirmacao_pagamento", { state: { fromOtpScreen: true } });
        
      } catch (error: any) {
        console.error('[OtpDataNascimentoScreen] Erro RLIAUTH:', error);
        
        let errorCode = 'RLIAUTH_ERROR';
        let errorMessage = "Erro ao validar token. Tente novamente.";
        let technicalError = error.message;
        let fullRequest = {
          method: 'RLIAUTH',
          transactionId: localStorage.getItem('transactionId'),
          token: digits.join('')
        };
        let fullResponse = error;
        
        if (error.message === 'TIMEOUT') {
          errorCode = 'TIMEOUT';
          errorMessage = "Timeout: O serviço não respondeu em tempo hábil (30s)";
          technicalError = "Timeout após 30 segundos - serviço indisponível";
        } else if (error.constructor.name === 'RlifundApiError') {
          // Handle structured RLIAUTH API errors (reusing RlifundApiError class)
          errorCode = error.errorCode;
          errorMessage = error.errorMessage;
          fullRequest = error.fullRequest;
          fullResponse = error.fullResponse;
        } else if (error.message.includes('HTTP error')) {
          const statusMatch = error.message.match(/status: (\d+)/);
          const status = statusMatch ? statusMatch[1] : 'desconhecido';
          errorCode = `HTTP_${status}`;
          errorMessage = `Erro HTTP ${status}: Falha na comunicação com o servidor`;
          technicalError = `HTTP ${status} - ${error.message}`;
        } else if (error.message.includes('Sessão expirada')) {
          // Don't show error modal for session expiration, just navigate
          return;
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
        setIsLoadingAuth(false);
      }
    }
  };

  // Format digits to display as DD/MM/YYYY if 8 digits are entered
  const formattedDate = () => {
    if (digits.length === 0) return "";
    const dateString = digits.join("");
    if (digits.length <= 2) {
      return dateString;
    } else if (digits.length <= 4) {
      return `${dateString.substring(0, 2)}/${dateString.substring(2)}`;
    } else {
      return `${dateString.substring(0, 2)}/${dateString.substring(2, 4)}/${dateString.substring(4)}`;
    }
  };

  // Check if enter button should be enabled
  const isEnterEnabled = digits.length === 8 && !isLoadingAuth;

  // Retry function for error modal
  const handleRetry = () => {
    setShowErrorModal(false);
    setErrorDetails(null);
    handleEnter();
  };

  // Validation modal handlers
  const handleValidationPrimaryAction = () => {
    setShowValidationModal(false);
    setValidationMessage("");
    setValidationNextStep("");
    
    if (validationNextStep === "RLIAUTH") {
      // Try again - clear digits for new input
      setDigits([]);
    } else {
      // Continue to next step - navigate based on next_step
      if (validationNextStep === "RLIPAYS") {
        console.log('[OtpDataNascimentoScreen] Navigating to confirmacao_pagamento for RLIPAYS');
        navigate("/confirmacao_pagamento");
      } else {
        // Handle other next steps as needed
        console.log('[OtpDataNascimentoScreen] Unknown next step:', validationNextStep);
        navigate("/confirmacao_pagamento"); // Default navigation to payment confirmation
      }
    }
  };

  const handleValidationCancel = () => {
    setShowValidationModal(false);
    setValidationMessage("");
    setValidationNextStep("");
    navigate(-1); // Go back to previous screen
  };

  return (
    <PdvLayout className="pb-16">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="bg-dotz-laranja text-white">
          <CardTitle className="text-center">
            Pagamento Cliente A
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-4">
              Digite os 8 dígitos da data de nascimento
            </h3>
            
            {/* Display the entered digits */}
            <div className="bg-white border rounded-md p-4 mb-4 text-xl font-mono min-h-16 flex items-center justify-center">
              {formattedDate() || "DD/MM/YYYY"}
            </div>
            
            
            
            {/* Numeric keypad */}
            <div className="grid grid-cols-3 gap-4">
              {/* Row 1: 1, 2, 3 */}
              <Button 
                variant="outline" 
                onClick={() => handleNumberClick("1")} 
                className="h-14 text-xl shadow-sm"
                disabled={isLoadingAuth}
              >
                1
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleNumberClick("2")} 
                className="h-14 text-xl shadow-sm"
                disabled={isLoadingAuth}
              >
                2
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleNumberClick("3")} 
                className="h-14 text-xl shadow-sm"
                disabled={isLoadingAuth}
              >
                3
              </Button>
              
              {/* Row 2: 4, 5, 6 */}
              <Button 
                variant="outline" 
                onClick={() => handleNumberClick("4")} 
                className="h-14 text-xl shadow-sm"
                disabled={isLoadingAuth}
              >
                4
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleNumberClick("5")} 
                className="h-14 text-xl shadow-sm"
                disabled={isLoadingAuth}
              >
                5
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleNumberClick("6")} 
                className="h-14 text-xl shadow-sm"
                disabled={isLoadingAuth}
              >
                6
              </Button>
              
              {/* Row 3: 7, 8, 9 */}
              <Button 
                variant="outline" 
                onClick={() => handleNumberClick("7")} 
                className="h-14 text-xl shadow-sm"
                disabled={isLoadingAuth}
              >
                7
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleNumberClick("8")} 
                className="h-14 text-xl shadow-sm"
                disabled={isLoadingAuth}
              >
                8
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleNumberClick("9")} 
                className="h-14 text-xl shadow-sm"
                disabled={isLoadingAuth}
              >
                9
              </Button>
              
              {/* Row 4: Backspace, 0, Enter */}
              <Button 
                variant="outline" 
                onClick={handleBackspace} 
                className="h-14 text-xl shadow-sm"
                disabled={isLoadingAuth}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleNumberClick("0")} 
                className="h-14 text-xl shadow-sm"
                disabled={isLoadingAuth}
              >
                0
              </Button>
              <Button 
                variant={isEnterEnabled ? "dotz" : "outline"} 
                onClick={handleEnter} 
                disabled={!isEnterEnabled || isLoadingAuth} 
                className="h-14 text-sm font-bold shadow-sm"
              >
                {isLoadingAuth ? <Loader2 className="h-4 w-4 animate-spin" /> : "ENTRA"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onRetry={handleRetry}
        errorCode={errorDetails?.code}
        errorMessage={errorDetails?.message}
        fullRequest={errorDetails?.request}
        fullResponse={errorDetails?.fullError}
        apiType="RLIAUTH"
      />

      {/* Validation Modal */}
      <ValidationModal
        isOpen={showValidationModal}
        onPrimaryAction={handleValidationPrimaryAction}
        onCancel={handleValidationCancel}
        message={validationMessage}
        primaryButtonText={validationNextStep === "RLIAUTH" ? "Tentar Novamente" : "Continuar"}
        cancelButtonText="Cancelar"
      />

      {/* Technical Footer Component */}
      <TechnicalFooter
        slug="RLIDEALRLIAUTH"
        sourceScreen="otp_data_nascimento"
      />
    </PdvLayout>
  );
};

export default OtpDataNascimentoScreen;
