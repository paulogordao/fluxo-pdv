
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
import { generateRandomPaymentType, generateRandomBin, getCartCache } from "@/utils/cacheUtils";
import {
  CreditCard,
  CreditCard as DebitCard,
  ShoppingCart as CartaoA,
  Gift as Vale,
  Award as Resgate,
  QrCode as Pix,
  Utensils as ValeRefeicao,
  ShoppingCart
} from "lucide-react";
import EncerrarAtendimentoButton from "@/components/EncerrarAtendimentoButton";

const ConfirmacaoPagamentoScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPaymentOption } = usePaymentOption();
  const { tipo_simulacao, isLoading: sessionLoading, ambiente } = useUserSession();
  const { totalAmount, setInitialCart } = usePdv();
  
  // Check if coming from token screen or otp screen
  const comingFromTokenScreen = location.state?.fromTokenScreen || false;
  const comingFromOtpScreen = location.state?.fromOtpScreen || false;
  
  // Check if coming directly from ScanScreen (FUND -> RLIPAYS flow)
  const comingFromScanScreen = location.state?.fromScanScreenFund || false;
  
  // Check if coming from ScanScreen (RLIDEAL -> RLIPAYS flow)
  const comingFromScanScreenIdeal = location.state?.fromScanScreenIdeal || false;
  
  // Check if coming from app screen (RLIWAIT -> RLIPAYS flow)
  const comingFromAppScreen = location.state?.fromAppScreen || false;
  
  // Check if coming from RLIDEAL with "none" option
  const comingFromRlidealNone = location.state?.fromRlidealNoneOption || false;
  
  // Check if token validation failed (fatal error)
  const tokenValidationFailed = location.state?.tokenValidationFailed || false;
  
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

  // State for technical data
  const [technicalRequestData, setTechnicalRequestData] = useState<string | undefined>();
  const [technicalResponseData, setTechnicalResponseData] = useState<string | undefined>();
  const [technicalPreviousRequestData, setTechnicalPreviousRequestData] = useState<string | undefined>();

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
      comingFromScanScreenIdeal,
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

    // Check if coming from RLIDEAL with "none" option
    if (comingFromRlidealNone) {
      try {
        const rlidealResponseStr = localStorage.getItem('rlidealResponse');
        if (rlidealResponseStr) {
          const rlidealResponse = JSON.parse(rlidealResponseStr);
          const orderData = rlidealResponse[0]?.response?.data?.order;
          
          console.log('[ConfirmacaoPagamento] Using RLIDEAL data for none option:', orderData);
          
          if (orderData) {
            const subtotal = orderData.value?.toFixed(2).replace('.', ',') || "0,00";
            const desconto = orderData.discount?.toFixed(2).replace('.', ',') || "0,00";
            const residual = orderData.residual?.toFixed(2).replace('.', ',') || subtotal;
            
            setDisplayValues({
              subtotal,
              desconto,
              recebido: "0,00", // Nenhum pagamento foi feito ainda (opção "nenhum")
              showEncargos: true
            });
            
            setPaymentAmount({ 
              encargos: residual, 
              recebido: "0,00" 
            });
            
            setDocumentationSlug("RLIDEALRLIPAYS");
            
            console.log('[ConfirmacaoPagamento] Using RLIDEAL values for none option:', {
              subtotal, desconto, residual
            });
            return;
          }
        }
      } catch (error) {
        console.error('[ConfirmacaoPagamento] Error reading RLIDEAL data for none option:', error);
      }
    }

    // Check if coming from ScanScreen (RLIDEAL -> RLIPAYS flow)
    if (comingFromScanScreenIdeal && totalAmount > 0) {
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
      
      setDocumentationSlug("RLIDEALRLIPAYS");
      
      console.log('[ConfirmacaoPagamento] Using real cart value from RLIDEAL flow:', {
        totalAmount,
        totalAmountStr
      });
      return;
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

    // Check if token validation failed - use RLIDEAL data instead of RLIAUTH
    if (tokenValidationFailed && comingFromTokenScreen) {
      try {
        // Try to load RLIDEAL response which has the order data
        const rlidealResponseStr = localStorage.getItem('rlidealResponse');
        if (rlidealResponseStr) {
          const rlidealResponse = JSON.parse(rlidealResponseStr);
          const orderData = rlidealResponse[0]?.response?.data?.order;
          
          console.log('[ConfirmacaoPagamento] Token validation failed, using RLIDEAL order data:', orderData);
          
          if (orderData) {
            const subtotal = orderData.value?.toFixed(2).replace('.', ',') || "0,00";
            const desconto = orderData.discount?.toFixed(2).replace('.', ',') || "0,00";
            const remainingValue = orderData.residual?.toFixed(2).replace('.', ',') || subtotal;
            
            setDisplayValues({
              subtotal,
              desconto,
              recebido: "0,00", // No payment was made since token failed
              showEncargos: true
            });
            
            setPaymentAmount({ 
              encargos: remainingValue, 
              recebido: "0,00" 
            });
            
            setDocumentationSlug("RLIAUTHRLIPAYS");
            
            console.log('[ConfirmacaoPagamento] Using RLIDEAL values after token failure:', {
              subtotal, desconto, remainingValue
            });
            return;
          }
        }
      } catch (error) {
        console.error('[ConfirmacaoPagamento] Error reading RLIDEAL data for token failure:', error);
      }
    }

    if (!isOfflineCompany && rliauthData?.length > 0 && (comingFromTokenScreen || comingFromOtpScreen) && !tokenValidationFailed) {
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
  }, [selectedPaymentOption, comingFromTokenScreen, comingFromOtpScreen, comingFromScanScreen, comingFromScanScreenIdeal, comingFromAppScreen, comingFromRlidealNone, tipo_simulacao, sessionLoading, rliauthData, totalAmount, tokenValidationFailed]);

  // Load technical data from localStorage based on flow
  useEffect(() => {
    let previousServiceResponse = null;
    
    if (comingFromScanScreen) {
      // Fluxo FUND → RLIPAYS
      previousServiceResponse = localStorage.getItem('rlifundResponse');
      console.log('[ConfirmacaoPagamento] Loading RLIFUND response for technical data');
    } else if (comingFromScanScreenIdeal) {
      // Fluxo RLIDEAL → RLIPAYS
      previousServiceResponse = localStorage.getItem('rlidealResponse');
      console.log('[ConfirmacaoPagamento] Loading RLIDEAL response for technical data');
    } else if (comingFromRlidealNone) {
      // Fluxo RLIDEAL → RLIPAYS (opção "nenhum")
      previousServiceResponse = localStorage.getItem('rlidealResponse');
      console.log('[ConfirmacaoPagamento] Loading RLIDEAL response for technical data (none option)');
    } else if (!comingFromTokenScreen && !comingFromOtpScreen && !comingFromAppScreen) {
      // Fluxo RLIDEAL → RLIPAYS (vindo de meios de pagamento)
      previousServiceResponse = localStorage.getItem('rlidealResponse');
      console.log('[ConfirmacaoPagamento] Loading RLIDEAL response for technical data');
    } else if (comingFromTokenScreen || comingFromOtpScreen) {
      // Para token/OTP, usar rliauthData se disponível
      if (rliauthData?.length > 0) {
        previousServiceResponse = JSON.stringify(rliauthData[0]?.response, null, 2);
        console.log('[ConfirmacaoPagamento] Using RLIAUTH response for technical data');
      }
    } else if (comingFromAppScreen) {
      // Fluxo RLIWAIT → RLIPAYS
      const rliwaitResponse = localStorage.getItem('rliwaitResponse');
      if (rliwaitResponse) {
        previousServiceResponse = rliwaitResponse;
        console.log('[ConfirmacaoPagamento] Loading RLIWAIT response for technical data');
      }
    }
    
    if (previousServiceResponse) {
      try {
        const parsedData = JSON.parse(previousServiceResponse);
        if (Array.isArray(parsedData) && parsedData[0]) {
          // Extract request and response separately from previous service
          if (parsedData[0].request) {
            setTechnicalPreviousRequestData(JSON.stringify(parsedData[0].request, null, 2));
          }
          if (parsedData[0].response) {
            setTechnicalResponseData(JSON.stringify(parsedData[0].response, null, 2));
          }
        } else {
          // For cases where the response is not in array format
          setTechnicalResponseData(JSON.stringify(parsedData, null, 2));
        }
      } catch (error) {
        console.error('Error parsing previous service response:', error);
        setTechnicalResponseData(previousServiceResponse);
      }
    }
    
      // Generate RLIPAYS request data based on current transaction
      const transactionId = localStorage.getItem('transactionId');
      if (transactionId) {
        const remainingAmount = calculateRemainingAmount();
        let payments = undefined;
        
        if (remainingAmount > 0) {
          payments = [{
            type: 1,
            bin: "",
            amount: parseFloat(remainingAmount.toFixed(2)), // Ensure exactly 2 decimal places
            description: "Pagamento em Dinheiro"
          }];
        }
        
        const requestData = {
          route: "RLIPAYS",
          version: 1,
          input: {
            transaction_id: transactionId,
            payments: payments
          }
        };
        
        setTechnicalRequestData(JSON.stringify(requestData, null, 2));
        console.log('[ConfirmacaoPagamento] Generated dynamic RLIPAYS request data');
      }
  }, [comingFromScanScreen, comingFromScanScreenIdeal, comingFromTokenScreen, comingFromOtpScreen, comingFromAppScreen, rliauthData]);

  // Prepare technical documentation data (fallback for API call)
  useEffect(() => {
    const prepareApiData = async () => {
      try {
        // Only call API if we don't have dynamic data and need fallback
        if (!technicalRequestData && !technicalResponseData) {
          console.log(`[ConfirmacaoPagamento] Loading technical docs for ${documentationSlug}`);
          const data = await consultaFluxoService.consultarFluxoDetalhe(documentationSlug);
          setApiData(data);
          console.log('[ConfirmacaoPagamento] API data loaded:', data);
        } else {
          console.log('[ConfirmacaoPagamento] Using dynamic technical data, skipping API call');
        }
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
  }, [documentationSlug, tipo_simulacao, sessionLoading, technicalRequestData, technicalResponseData]);

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
            const remainingAmount = parseFloat((order.value - order.paid_out).toFixed(2));
            console.log('[ConfirmacaoPagamento] Using RLIWAIT remaining amount for RLIPAYS:', remainingAmount);
            return remainingAmount;
          }
        }
      } catch (error) {
        console.error('[ConfirmacaoPagamento] Error reading orderData for calculation:', error);
      }
    }
    
    // If coming from RLIDEAL none option, use residual from RLIDEAL response
    if (comingFromRlidealNone) {
      try {
        const rlidealResponseStr = localStorage.getItem('rlidealResponse');
        if (rlidealResponseStr) {
          const rlidealResponse = JSON.parse(rlidealResponseStr);
          const residual = rlidealResponse[0]?.response?.data?.order?.residual;
          if (residual !== undefined) {
            const result = parseFloat(residual.toFixed(2));
            console.log('[ConfirmacaoPagamento] Using RLIDEAL residual for none option RLIPAYS:', result);
            return result;
          }
        }
      } catch (error) {
        console.error('[ConfirmacaoPagamento] Error reading RLIDEAL response for none option:', error);
      }
    }
    
    // If coming directly from ScanScreen (FUND -> RLIPAYS flow), return the real cart total
    if (comingFromScanScreen && totalAmount > 0) {
      const result = parseFloat(totalAmount.toFixed(2));
      console.log('[ConfirmacaoPagamento] Using real cart total for RLIPAYS:', result);
      return result;
    }
    
    // If coming from ScanScreen RLIDEAL flow, use residual from RLIDEAL response
    if (comingFromScanScreenIdeal) {
      try {
        const rlidealResponseStr = localStorage.getItem('rlidealResponse');
        if (rlidealResponseStr) {
          const rlidealResponse = JSON.parse(rlidealResponseStr);
          const residual = rlidealResponse[0]?.response?.data?.order?.residual;
          if (residual !== undefined) {
            const result = parseFloat(residual.toFixed(2));
            console.log('[ConfirmacaoPagamento] Using RLIDEAL residual amount for RLIPAYS:', result);
            return result;
          }
        }
      } catch (error) {
        console.error('[ConfirmacaoPagamento] Error reading RLIDEAL response:', error);
      }
      
      // Fallback to totalAmount if residual not available
      if (totalAmount > 0) {
        const result = parseFloat(totalAmount.toFixed(2));
        console.log('[ConfirmacaoPagamento] Using real cart total for RLIDEAL RLIPAYS (fallback):', result);
        return result;
      }
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
      console.log('[ConfirmacaoPagamento] Calculated residual amount:', remainingAmount);
      console.log('[ConfirmacaoPagamento] Flow type:', comingFromAppScreen ? 'RLIWAIT->RLIPAYS' : 'FUND->RLIPAYS');
      
      // Create payments array only if there's a residual amount > 0
      let payments = undefined;
      if (remainingAmount > 0) {
        // Generate random payment type and corresponding fields
        const paymentType = generateRandomPaymentType();
        let bin = "";
        let description = "Pagamento em Dinheiro";
        
        if (paymentType === 2) {
          bin = generateRandomBin();
          description = "Pagamento em cartão de crédito";
        }
        
        payments = [{
          type: paymentType,
          bin: bin,
          amount: parseFloat(remainingAmount.toFixed(2)), // Ensure exactly 2 decimal places
          description: description
        }];
        console.log('[ConfirmacaoPagamento] Created payments array with type:', paymentType, payments);
      } else {
        console.log('[ConfirmacaoPagamento] No residual amount - omitting payments array');
      }
      
      // Call RLIPAYS service with payments array
      const response = await comandoService.enviarComandoRlipays(transactionId, payments);
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
      
      // Show production environment toast if applicable
      if (ambiente === "producao") {
        toast.success(
          "Transação realizada em PRODUÇÃO! Caso necessário, acesse o Relatório de Estornos.",
          {
            duration: 8000,
            action: {
              label: "Ver Estornos",
              onClick: () => navigate('/relatorio_estornos')
            }
          }
        );
      }
      
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

  const handleContinuarComprando = () => {
    try {
      // Recuperar cache do carrinho
      const cartCache = getCartCache();
      
      if (!cartCache) {
        console.warn('[ConfirmacaoPagamento] Nenhum cache de carrinho encontrado');
        toast.warning("Não há produtos salvos. Iniciando nova compra.");
        navigate('/scan');
        return;
      }
      
      console.log('[ConfirmacaoPagamento] Cache encontrado:', cartCache);
      
      toast.success(`Carrinho restaurado - ${cartCache.cart.length} produto(s) carregado(s)`);
      
      // Navegar para página de scan com flag para restaurar do cache
      navigate('/scan', { state: { restoreFromCache: true } });
    } catch (error) {
      console.error('[ConfirmacaoPagamento] Erro ao restaurar carrinho:', error);
      toast.error("Não foi possível restaurar o carrinho");
    }
  };

  // Determine the previous service name based on the flow
  const getPreviousServiceName = () => {
    if (comingFromScanScreen) {
      return 'RLIFUND';
    } else if (comingFromTokenScreen || comingFromOtpScreen) {
      return 'RLIAUTH';
    } else if (comingFromAppScreen) {
      return 'RLIWAIT';
    } else {
      return 'RLIDEAL'; // Default flow (from payment methods)
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-16">
      {/* Success Message Overlay */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Pagamento realizado com sucesso!
            </h2>
            
            {/* Production environment info */}
            {ambiente === "producao" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium mb-2">
                  🔴 Transação realizada em ambiente de <strong>PRODUÇÃO</strong>
                </p>
                <p className="text-xs text-red-700">
                  Caso necessário estornar, acesse:{" "}
                  <button
                    onClick={() => navigate('/relatorio_estornos')}
                    className="underline font-medium hover:text-red-900"
                  >
                    Relatório de Estornos
                  </button>
                </p>
              </div>
            )}
            
            <p className="text-gray-600 mb-4">
              A transação foi processada.
            </p>
            <div className="text-lg font-semibold text-primary">
              Redirecionando em <span className="text-2xl">{countdown}</span> segundos...
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
            <div className="bg-red-600 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-medium">Confirmação de Pagamento</h2>
              <EncerrarAtendimentoButton />
            </div>
            
            {/* Production environment warning - shown only in production */}
            {ambiente === "producao" && !showSuccessMessage && (
              <div className="m-4 p-4 bg-red-50 border-l-4 border-red-600 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-bold text-red-800">
                      ⚠️ ATENÇÃO: TRANSAÇÃO EM AMBIENTE DE PRODUÇÃO
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p className="mb-2">
                        Esta transação será processada no <strong>ambiente produtivo</strong> e <strong>movimentará valores reais</strong>.
                      </p>
                      <p>
                        Caso necessário, a transação poderá ser estornada após a finalização através do <strong>Relatório de Estornos</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
            <div className="bg-red-600 text-white p-3">
              {tipo_simulacao !== "OFFLINE" && !sessionLoading ? (
                <div className="flex items-center justify-between gap-3">
                  {/* Botão "Continuar comprando" à esquerda */}
                  <Button
                    onClick={handleContinuarComprando}
                    disabled={isLoadingPayment || showSuccessMessage}
                    variant="outline"
                    className="bg-white text-blue-600 hover:bg-gray-100 border-blue-600 font-medium px-4 py-2 rounded flex items-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Continuar comprando
                  </Button>
                  
                  {/* Botão "Finalizar pagamento" à direita */}
                  <Button
                    onClick={handleFinalizarPagamento}
                    disabled={isLoadingPayment || showSuccessMessage}
                    className="bg-white text-red-600 hover:bg-gray-100 font-medium px-6 py-2 rounded flex-1"
                  >
                    {isLoadingPayment ? "Finalizando..." : "Finalizar pagamento"}
                  </Button>
                </div>
              ) : (
                <p className="text-center">Sem troco {!displayValues.showEncargos ? `- R$ ${paymentAmount.encargos}` : ''}</p>
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
        requestData={technicalRequestData || apiData.request_servico}
        responseData={technicalResponseData || apiData.response_servico_anterior}
        previousRequestData={technicalPreviousRequestData}
        isLoading={isLoading}
        slug={documentationSlug}
        loadOnMount={false}
        sourceScreen="confirmacao_pagamento"
        previousServiceName={getPreviousServiceName()}
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
