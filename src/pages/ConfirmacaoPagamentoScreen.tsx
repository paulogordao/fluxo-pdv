
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useNavigate, useLocation } from "react-router-dom";
import TechnicalFooter from "@/components/TechnicalFooter";
import GuiaDeNavegacaoAPI from "@/components/GuiaDeNavegacaoAPI";
import { usePaymentOption } from "@/context/PaymentOptionContext";
import { consultaFluxoService } from "@/services/consultaFluxoService";
import { useUserSession } from "@/hooks/useUserSession";
import { comandoService, RlifundApiError } from "@/services/comandoService";
import ErrorModal from "@/components/ErrorModal";
import { usePdv } from "@/context/PdvContext";
import { 
  CreditCard,
  CreditCard as DebitCard,
  ShoppingCart as CartaoA,
  Gift as Vale,
  Award as Resgate,
  QrCode as Pix,
  Utensils as ValeRefeicao
} from "lucide-react";

const ConfirmacaoPagamentoScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPaymentOption } = usePaymentOption();
  const { tipo_simulacao, isLoading: sessionLoading } = useUserSession();
  const { totalAmount } = usePdv();
  
  // Check if coming from token screen or otp screen
  const comingFromTokenScreen = location.state?.fromTokenScreen || false;
  const comingFromOtpScreen = location.state?.fromOtpScreen || false;
  
  // Check if coming directly from ScanScreen (FUND -> RLIPAYS flow)
  const comingFromScanScreen = location.state?.fromScanScreenFund || false;
  
  // Check if coming from app screen (RLIWAIT -> RLIPAYS flow)
  const comingFromAppScreen = location.state?.fromAppScreen || false;
  
  // Payment amounts and display values
  const [paymentAmount, setPaymentAmount] = useState({ encargos: "68,93", recebido: "68,93" });
  const [displayValues, setDisplayValues] = useState({
    subtotal: "68,93",
    desconto: "0,00",
    recebido: "68,93",
    showEncargos: true
  });
  
  // Technical documentation states
  const [apiData, setApiData] = useState<{
    request_servico?: string | null;
    response_servico_anterior?: string | null;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [documentationSlug, setDocumentationSlug] = useState("RLIWAITRLIPAYS");
  const [rliauthData, setRliauthData] = useState<any>(null);

  // RLIPAYS button states
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [rlipaysResponse, setRlipaysResponse] = useState<any>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Load RLIAUTH data from localStorage for dynamic content
  useEffect(() => {
    const loadRliauthData = () => {
      try {
        const stored = localStorage.getItem('rliauthResponse');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('[ConfirmacaoPagamento] RLIAUTH data loaded:', parsed);
          setRliauthData(parsed);
        }
      } catch (error) {
        console.error('[ConfirmacaoPagamento] Error loading RLIAUTH data:', error);
      }
    };

    loadRliauthData();
  }, []);

  // Set payment amount and display values based on company type and data source
  useEffect(() => {
    if (sessionLoading) return;

    const isOfflineCompany = tipo_simulacao === "OFFLINE";
    console.log('[ConfirmacaoPagamento] Company type check:', { 
      tipo_simulacao, 
      isOfflineCompany, 
      comingFromScanScreen, 
      comingFromAppScreen,
      totalAmount 
    });

    // Check if coming from app screen (RLIWAIT -> RLIPAYS flow)
    if (comingFromAppScreen) {
      try {
        const orderDataStr = localStorage.getItem('orderData');
        if (orderDataStr) {
          const orderData = JSON.parse(orderDataStr);
          console.log('[ConfirmacaoPagamento] Using RLIWAIT order data:', orderData);
          
          const order = orderData.order;
          if (order) {
            const subtotal = order.value?.toFixed(2).replace('.', ',') || "0,00";
            const desconto = order.discount?.toFixed(2).replace('.', ',') || "0,00";
            const paidOut = order.paid_out?.toFixed(2).replace('.', ',') || "0,00";
            const remainingValue = (order.value - order.paid_out).toFixed(2).replace('.', ',');
            
            setDisplayValues({
              subtotal,
              desconto,
              recebido: paidOut,
              showEncargos: false
            });
            
            setPaymentAmount({ 
              encargos: remainingValue, 
              recebido: paidOut 
            });
            
            setDocumentationSlug("RLIWAITRLIPAYS");
            
            console.log('[ConfirmacaoPagamento] Using RLIWAIT values:', {
              subtotal, desconto, paidOut, remainingValue
            });
            return;
          }
        }
      } catch (error) {
        console.error('[ConfirmacaoPagamento] Error reading orderData from localStorage:', error);
      }
    }

    // Check if coming directly from ScanScreen (FUND -> RLIPAYS flow)
    if (comingFromScanScreen && totalAmount > 0) {
      const totalAmountStr = totalAmount.toFixed(2).replace('.', ',');
      
      setDisplayValues({
        subtotal: totalAmountStr,
        desconto: "0,00",
        recebido: totalAmountStr,
        showEncargos: true
      });
      
      setPaymentAmount({ 
        encargos: totalAmountStr, 
        recebido: totalAmountStr 
      });
      
      // Use RLIPAYS for FUND → RLIPAYS flow since RLIFUNDRLIPAYS may not exist
      console.log('[ConfirmacaoPagamento] Setting documentation SLUG to RLIPAYS for FUND → RLIPAYS flow');
      setDocumentationSlug("RLIPAYS");
      
      console.log('[ConfirmacaoPagamento] Using real cart value from PdvContext:', {
        totalAmount,
        totalAmountStr
      });
      return;
    }

    if (!isOfflineCompany && rliauthData?.length > 0 && (comingFromTokenScreen || comingFromOtpScreen)) {
      // Use dynamic data from RLIAUTH for non-OFFLINE companies
      const orderData = rliauthData[0]?.response?.data?.order;
      if (orderData) {
        const subtotal = orderData.value?.toFixed(2).replace('.', ',') || "0,00";
        const desconto = orderData.discount?.toFixed(2).replace('.', ',') || "0,00";
        const recebido = orderData.paid_out?.toFixed(2).replace('.', ',') || "0,00";
        const remainingValue = (orderData.value - orderData.paid_out).toFixed(2).replace('.', ',');

        setDisplayValues({
          subtotal,
          desconto,
          recebido,
          showEncargos: false
        });
        
        setPaymentAmount({ encargos: remainingValue, recebido });
        setDocumentationSlug("RLIAUTHRLIPAYS");
        
        console.log('[ConfirmacaoPagamento] Using dynamic RLIAUTH data:', {
          subtotal, desconto, recebido, remainingValue
        });
        return;
      }
    }

    // Fallback to static values (for OFFLINE companies or when no RLIAUTH data)
    if (comingFromTokenScreen || comingFromOtpScreen) {
      setPaymentAmount({ encargos: "30,00", recebido: "30,00" });
      setDisplayValues({
        subtotal: "68,93",
        desconto: "0,00", 
        recebido: "30,00",
        showEncargos: true
      });
      setDocumentationSlug("RLIAUTHRLIPAYS");
      console.log('[ConfirmacaoPagamento] Using static values for token/OTP flow');
    } else if (selectedPaymentOption === "livelo") {
      setPaymentAmount({ encargos: "60,00", recebido: "60,00" });
      setDisplayValues({
        subtotal: "68,93",
        desconto: "0,00",
        recebido: "60,00", 
        showEncargos: true
      });
      console.log('[ConfirmacaoPagamento] Livelo option selected');
    } else if (selectedPaymentOption === "dotz") {
      setPaymentAmount({ encargos: "3,00", recebido: "3,00" });
      setDisplayValues({
        subtotal: "68,93",
        desconto: "0,00",
        recebido: "3,00",
        showEncargos: true
      });
      if (!comingFromTokenScreen && !comingFromOtpScreen) {
        setDocumentationSlug("RLIDEALRLIPAYS");
      }
      console.log('[ConfirmacaoPagamento] Dotz option selected');
    } else {
      setPaymentAmount({ encargos: "68,93", recebido: "68,93" });
      setDisplayValues({
        subtotal: "68,93",
        desconto: "0,00",
        recebido: "68,93",
        showEncargos: true
      });
      console.log('[ConfirmacaoPagamento] Default option selected');
    }
  }, [selectedPaymentOption, comingFromTokenScreen, comingFromOtpScreen, comingFromScanScreen, comingFromAppScreen, tipo_simulacao, sessionLoading, rliauthData, totalAmount]);

  // Prepare technical documentation data
  useEffect(() => {
    const prepareApiData = async () => {
      try {
        // For non-OFFLINE companies with RLIAUTH data, use that instead of API call
        if (tipo_simulacao !== "OFFLINE" && rliauthData?.length > 0 && (comingFromTokenScreen || comingFromOtpScreen)) {
          const requestData = JSON.stringify(rliauthData[0]?.request || null, null, 2);
          const responseData = JSON.stringify(rliauthData[0]?.response || null, null, 2);
          
          setApiData({
            request_servico: requestData,
            response_servico_anterior: responseData
          });
          
          console.log('[ConfirmacaoPagamento] Using RLIAUTH data for technical docs');
          setIsLoading(false);
          return;
        }

        // Fallback to API call for other cases
        console.log(`[ConfirmacaoPagamento] Loading technical docs for ${documentationSlug}`);
        const data = await consultaFluxoService.consultarFluxoDetalhe(documentationSlug);
        setApiData(data);
        console.log('[ConfirmacaoPagamento] API data loaded:', data);
      } catch (error) {
        console.error('[ConfirmacaoPagamento] Error fetching API data:', error);
        toast.error("Erro ao carregar detalhes técnicos");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!sessionLoading) {
      prepareApiData();
    }
  }, [documentationSlug, tipo_simulacao, sessionLoading, rliauthData, comingFromTokenScreen, comingFromOtpScreen]);

  // Calculate remaining amount for non-OFFLINE companies
  const calculateRemainingAmount = (): number => {
    if (tipo_simulacao === "OFFLINE") return 0;
    
    // If coming from app screen (RLIWAIT -> RLIPAYS flow), use orderData
    if (comingFromAppScreen) {
      try {
        const orderDataStr = localStorage.getItem('orderData');
        if (orderDataStr) {
          const orderData = JSON.parse(orderDataStr);
          const order = orderData.order;
          if (order) {
            const remainingAmount = order.value - order.paid_out;
            console.log('[ConfirmacaoPagamento] Using RLIWAIT remaining amount for RLIPAYS:', remainingAmount);
            return remainingAmount;
          }
        }
      } catch (error) {
        console.error('[ConfirmacaoPagamento] Error reading orderData for calculation:', error);
      }
    }
    
    // If coming directly from ScanScreen (FUND -> RLIPAYS flow), return the real cart total
    if (comingFromScanScreen && totalAmount > 0) {
      console.log('[ConfirmacaoPagamento] Using real cart total for RLIPAYS:', totalAmount);
      return totalAmount;
    }
    
    const subtotalValue = parseFloat(displayValues.subtotal.replace('R$ ', '').replace('.', '').replace(',', '.'));
    const recebidoValue = parseFloat(displayValues.recebido.replace('R$ ', '').replace('.', '').replace(',', '.'));
    
    // Apply toFixed(2) to avoid floating point precision errors
    const result = parseFloat((subtotalValue - recebidoValue).toFixed(2));
    console.log('[ConfirmacaoPagamento] Calculated amount - subtotal:', subtotalValue, 'recebido:', recebidoValue, 'result:', result);
    
    return result;
  };

  // Success countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showSuccessMessage && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (showSuccessMessage && countdown === 0) {
      console.log('[ConfirmacaoPagamento] Redirecting to /index after successful payment');
      navigate('/index');
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showSuccessMessage, countdown, navigate]);

  const handleRestartFlow = () => {
    navigate('/welcome');
  };

  const handleFinalizarPagamento = async () => {
    console.log('[ConfirmacaoPagamento] Iniciando finalização de pagamento...');
    
    // Get transaction ID from localStorage
    const transactionId = localStorage.getItem('transactionId');
    if (!transactionId) {
      console.error('[ConfirmacaoPagamento] Transaction ID não encontrado no localStorage');
      toast.error("ID da transação não encontrado");
      return;
    }

    console.log('[ConfirmacaoPagamento] Transaction ID encontrado:', transactionId);
    setIsLoadingPayment(true);

    try {
      // Calculate remaining amount to send
      const remainingAmount = calculateRemainingAmount();
      console.log('[ConfirmacaoPagamento] Sending amount:', remainingAmount);
      
      // Call RLIPAYS service with amount
      const response = await comandoService.enviarComandoRlipays(transactionId, remainingAmount > 0 ? remainingAmount : undefined);
      console.log('[ConfirmacaoPagamento] RLIPAYS response:', response);
      
      // Save response for technical footer
      setRlipaysResponse(response);
      
      // Update technical documentation to show RLIPAYS
      setApiData({
        request_servico: JSON.stringify(response[0]?.request || null, null, 2),
        response_servico_anterior: JSON.stringify(response[0]?.response || null, null, 2)
      });
      
      // Show success message with countdown
      setShowSuccessMessage(true);
      setCountdown(5);
      
      // You can navigate to a success page or handle next steps based on response
      // const nextStep = response[0]?.response?.data?.next_step;
      // if (nextStep?.length > 0) {
      //   // Handle next step if needed
      // }
      
    } catch (error: any) {
      console.error('[ConfirmacaoPagamento] Erro ao finalizar pagamento:', error);
      
      if (error instanceof RlifundApiError) {
        console.log('[ConfirmacaoPagamento] Erro específico da API RLIFUND:', {
          code: error.errorCode,
          message: error.errorMessage,
          request: error.fullRequest,
          response: error.fullResponse
        });
        
        setErrorDetails({
          errorCode: error.errorCode,
          errorMessage: error.errorMessage,
          fullRequest: JSON.stringify(error.fullRequest, null, 2),
          fullResponse: JSON.stringify(error.fullResponse, null, 2),
          apiType: 'RLIPAYS'
        });
      } else {
        console.log('[ConfirmacaoPagamento] Erro genérico:', error.message);
        
        setErrorDetails({
          errorCode: 'ERRO_GENERICO',
          errorMessage: error.message || 'Erro desconhecido ao finalizar pagamento',
          fullRequest: JSON.stringify({ 
            comando: 'RLIPAYS', 
            id_transaction: transactionId 
          }, null, 2),
          fullResponse: null,
          apiType: 'RLIPAYS'
        });
      }
      
      setShowErrorModal(true);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handleRetryPayment = () => {
    setShowErrorModal(false);
    handleFinalizarPagamento();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-16">
      {/* Success Message Overlay */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Pagamento realizado com sucesso!
            </h2>
            <p className="text-gray-600 mb-6">
              A transação foi processada.
            </p>
            <div className="text-lg font-semibold text-primary">
              Redirecionando em {countdown} segundos...
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto">
        {/* PDV Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Panel - Receipt */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 text-white p-4">
              <h2 className="text-xl font-medium">Manoel, R$3 à R$1000 em opções de pagamento</h2>
            </div>
            
            {/* Receipt Details */}
            <div className="p-6">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">SubTotal (R$):</span>
                  <span>{displayValues.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Desconto (R$):</span>
                  <span>{displayValues.desconto}</span>
                </div>
                {/* Show "Valor Restante" for non-OFFLINE companies when there's remaining amount */}
                {tipo_simulacao !== "OFFLINE" && (
                  (() => {
                    const subtotalValue = parseFloat(displayValues.subtotal.replace('R$ ', '').replace('.', '').replace(',', '.'));
                    const recebidoValue = parseFloat(displayValues.recebido.replace('R$ ', '').replace('.', '').replace(',', '.'));
                    const valorRestante = subtotalValue - recebidoValue;
                    
                    return valorRestante > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor Restante (R$):</span>
                        <span className="text-orange-600 font-medium">
                          R$ {valorRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ) : null;
                  })()
                )}
                {displayValues.showEncargos && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Encargos (R$):</span>
                    <span className="text-red-600 font-medium">{paymentAmount.encargos}</span>
                  </div>
                )}
              </div>
              
              {/* Total */}
              <div className="bg-gray-200 p-3 mt-4 flex justify-between">
                <span className="font-medium">Recebido (R$):</span>
                <span className="font-medium">{displayValues.recebido}</span>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-red-600 text-white p-3 text-center">
              {tipo_simulacao !== "OFFLINE" && !sessionLoading ? (
                <Button
                  onClick={handleFinalizarPagamento}
                  disabled={isLoadingPayment || showSuccessMessage}
                  className="bg-white text-red-600 hover:bg-gray-100 font-medium px-6 py-2 rounded"
                >
                  {isLoadingPayment ? "Finalizando..." : "Finalizar pagamento"}
                </Button>
              ) : (
                <p>Sem troco {!displayValues.showEncargos ? `- R$ ${paymentAmount.encargos}` : ''}</p>
              )}
            </div>
          </div>

          {/* Right Panel - Payment Options */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-500 text-white p-3 text-center">
              <h3 className="text-lg font-medium">Escolher a forma de pagamento.</h3>
            </div>
            
            <div className="p-4">
              {/* Payment Buttons Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Row 1 */}
                <div className="bg-blue-500 text-white rounded p-4 flex flex-col items-center justify-center h-24">
                  <DebitCard className="h-6 w-6 mb-2" />
                  <span>Débito</span>
                </div>
                <div className="bg-yellow-400 text-gray-900 rounded p-4 flex flex-col items-center justify-center h-24">
                  <CreditCard className="h-6 w-6 mb-2" />
                  <span>Crédito</span>
                </div>
                <div className="bg-red-600 text-white rounded p-4 flex flex-col items-center justify-center h-24">
                  <CartaoA className="h-6 w-6 mb-2" />
                  <span>Cartão A</span>
                </div>
                
                {/* Row 2 */}
                <div className="bg-white border border-green-500 text-green-600 rounded p-4 flex flex-col items-center justify-center h-24">
                  <Pix className="h-6 w-6 mb-2" />
                  <span>PIX</span>
                </div>
                <div className="bg-orange-500 text-white rounded p-4 flex flex-col items-center justify-center h-24">
                  <Vale className="h-6 w-6 mb-2" />
                  <span>Vale Presente</span>
                </div>
                <div className="bg-blue-700 text-white rounded p-4 flex flex-col items-center justify-center h-24">
                  <Resgate className="h-6 w-6 mb-2" />
                  <span>Resgate Pontos</span>
                </div>
                
                {/* Row 3 */}
                <div className="bg-green-500 text-white rounded p-4 flex flex-col items-center justify-center h-24">
                  <ValeRefeicao className="h-6 w-6 mb-2" />
                  <span>Vale Refeição</span>
                </div>
                <div className="bg-white border border-gray-300 rounded p-4 flex flex-col items-center justify-center h-24 relative">
                  <span className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">2</span>
                  <span className="text-center">Pagar com<br />Cliente A</span>
                </div>
                <div className="bg-white border border-gray-300 rounded p-4 flex flex-col items-center justify-center h-24 invisible">
                  {/* Empty cell for grid alignment */}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Restart Flow Button - Added at the bottom of the page */}
        <div className="flex justify-center mt-8">
          <Button 
            variant="secondary" 
            onClick={handleRestartFlow}
            className="px-4 py-2 rounded mt-2"
          >
            Reiniciar fluxo de atendimento
          </Button>
        </div>
      </div>

      {/* Navigation Guide Component */}
      <GuiaDeNavegacaoAPI />
      
      {/* Technical Footer Component */}
      <TechnicalFooter
        slug={documentationSlug}
        loadOnMount={false}
        sourceScreen="confirmacao_pagamento"
        requestData={apiData.request_servico}
        responseData={apiData.response_servico_anterior}
        isLoading={isLoading}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onRetry={handleRetryPayment}
        errorCode={errorDetails?.errorCode}
        errorMessage={errorDetails?.errorMessage}
        fullRequest={errorDetails?.fullRequest}
        fullResponse={errorDetails?.fullResponse}
        apiType={errorDetails?.apiType}
      />
    </div>
  );
};

export default ConfirmacaoPagamentoScreen;
