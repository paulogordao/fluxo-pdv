import { useState, useEffect } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import TechnicalFooter from "@/components/TechnicalFooter";
import GuiaDeNavegacaoAPI from "@/components/GuiaDeNavegacaoAPI";
import { useRliwaitPolling } from "@/hooks/useRliwaitPolling";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogAction } from "@/components/ui/alert-dialog";
import { buildApiUrl } from "@/config/api";
import { useTokenPaymentEligibility } from "@/hooks/useTokenPaymentEligibility";
import EncerrarAtendimentoButton from "@/components/EncerrarAtendimentoButton";
import { comandoService } from "@/services/comandoService";
const ConfirmacaoPagamentoAppScreen = () => {
  const navigate = useNavigate();
  // Technical documentation states
  const [apiData, setApiData] = useState<{
    request_servico?: string | null;
    response_servico_anterior?: string | null;
  }>({});
  const [isLoading, setIsLoading] = useState(true);

  // State for technical data
  const [technicalRequestData, setTechnicalRequestData] = useState<string | undefined>();
  const [technicalResponseData, setTechnicalResponseData] = useState<string | undefined>();
  const [technicalPreviousRequestData, setTechnicalPreviousRequestData] = useState<string | undefined>();

  // Use the custom hook for token payment eligibility
  const {
    showTokenPaymentButton,
    tokenButtonLoading
  } = useTokenPaymentEligibility();

  // Token payment modal state
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  // Available payment options from OTP response
  const [availablePaymentOptions, setAvailablePaymentOptions] = useState<Array<{
    option: string;
    message: string;
  }>>([]);

  // Alert dialogs state
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [rlidealAlertOpen, setRlidealAlertOpen] = useState(false);
  const [timeoutModalOpen, setTimeoutModalOpen] = useState(false);

  // Token loading state
  const [isTokenLoading, setIsTokenLoading] = useState(false);

  // Dynamic token amount state
  const [tokenAmount, setTokenAmount] = useState<string>("R$ 30,00");

  // Get client name from localStorage (fallback to empty string if not available)
  const clientName = localStorage.getItem('nomeCliente') || '';

  // Detect flow type and get transaction ID
  const isOnlineFlow = localStorage.getItem('tipo_simulacao') !== 'OFFLINE';
  const transactionId = localStorage.getItem('transactionId');

  // RLIWAIT polling for ONLINE flow
  const {
    pollingStatus,
    startPolling,
    stopPolling,
    sendCancelRequest
  } = useRliwaitPolling(isOnlineFlow ? transactionId : null, false // Don't auto start
  );

  // Fetch API data for technical documentation
  useEffect(() => {
    const fetchApiData = async () => {
      try {
        const url = buildApiUrl('/consultaFluxoDetalhe', {
          SLUG: 'RLIDEALRLIWAIT'
        });
        console.log("Fetching API details:", url);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error in request: ${response.status}`);
        }
        const data = await response.json();
        setApiData(data);
        console.log("API data:", data);
      } catch (error) {
        console.error("Error fetching API data:", error);
        toast.error("Erro ao carregar detalhes técnicos");
      } finally {
        setIsLoading(false);
      }
    };
    fetchApiData();
  }, []);

  // Load technical data from localStorage and generate dynamic request data
  useEffect(() => {
    // Load RLIDEAL response from localStorage (from previous screen)
    const rlidealResponse = localStorage.getItem('rlidealResponse');
    if (rlidealResponse) {
      try {
        const parsedData = JSON.parse(rlidealResponse);
        if (Array.isArray(parsedData) && parsedData[0]) {
          // Extract request from previous service
          if (parsedData[0].request) {
            setTechnicalPreviousRequestData(JSON.stringify(parsedData[0].request, null, 2));
          }
          // Extract response from previous service
          if (parsedData[0].response) {
            setTechnicalResponseData(JSON.stringify(parsedData[0].response, null, 2));
          }
        } else {
          // For cases where response is not in array format
          setTechnicalResponseData(JSON.stringify(parsedData, null, 2));
        }
      } catch (error) {
        console.error('Error parsing rlidealResponse:', error);
        setTechnicalResponseData(rlidealResponse);
      }
    }

    // Generate RLIWAIT request data based on current transaction
    if (transactionId) {
      const requestData = {
        route: "RLIWAIT",
        version: 1,
        input: {
          transaction_id: transactionId
        }
      };
      setTechnicalRequestData(JSON.stringify(requestData, null, 2));
    }
  }, [transactionId]);

  // Monitor localStorage changes for RLIDEAL response
  useEffect(() => {
    const handleStorageChange = () => {
      const rlidealResponse = localStorage.getItem('rlidealResponse');
      if (rlidealResponse) {
        setTechnicalResponseData(rlidealResponse);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Start polling when component mounts (ONLINE flow only)
  useEffect(() => {
    if (isOnlineFlow && transactionId) {
      console.log('[ConfirmacaoPagamentoAppScreen] Starting RLIWAIT polling for ONLINE flow');
      startPolling();
    }
  }, [isOnlineFlow, transactionId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      console.log('[ConfirmacaoPagamentoAppScreen] Component unmounting - stopping polling');
      if (pollingStatus.isPolling) {
        stopPolling();
      }
    };
  }, []);

  // Monitor polling timeout
  useEffect(() => {
    if (pollingStatus.status === 'timeout') {
      console.log('[ConfirmacaoPagamentoAppScreen] Polling timeout detected - showing modal');
      setTimeoutModalOpen(true);
    }
  }, [pollingStatus.status]);

  // Handle finalizar pagamento button click
  const handleFinalizarPagamento = () => {
    if (pollingStatus.orderData) {
      // Store complete payment data for RLIPAYS
      localStorage.setItem('orderData', JSON.stringify({
        order: pollingStatus.orderData.order,
        payments: pollingStatus.orderData.payments,
        transaction_id: pollingStatus.orderData.transaction_id,
        customer_info_id: pollingStatus.orderData.customer_info_id,
        next_step: pollingStatus.nextStepData
      }));
      console.log('[ConfirmacaoPagamentoAppScreen] Order data stored, navigating to confirmacao_pagamento');
      navigate('/confirmacao_pagamento', {
        state: {
          fromAppScreen: true
        }
      });
    }
  };
  const handlePaymentConfirmation = () => {
    navigate("/confirmacao_pagamento");
  };
  const handleCancel = async () => {
    console.log('[ConfirmacaoPagamentoApp] User clicked cancel button');
    
    if (isOnlineFlow && transactionId) {
      console.log('[ConfirmacaoPagamentoApp] Sending cancel request before stopping polling');
      
      // Enviar RLIWAIT com cancel=true
      await sendCancelRequest();
      
      // Parar o polling
      if (pollingStatus.isPolling) {
        stopPolling();
      }
    }
    
    console.log('[ConfirmacaoPagamentoApp] Returning to confirmation screen');
    navigate("/confirmacao_pagamento", {
      state: { fromAppScreen: true }
    });
  };

  // Show alert dialog first
  const handleTokenPaymentClick = () => {
    console.log("Alerta exibido: necessário executar break step via RLIFUND antes do token.");
    setAlertDialogOpen(true);
  };

  // Handler for when alert OK button is clicked
  const handleAlertConfirm = async () => {
    console.log("[Token] Iniciando refazer checkout com payment_option_type: otp");
    setIsTokenLoading(true);
    setAlertDialogOpen(false);
    try {
      // Recuperar dados originais do carrinho
      const cartCacheStr = localStorage.getItem('cartCache');
      if (!cartCacheStr) {
        console.error('[Token] Dados do carrinho não encontrados');
        toast.error("Dados da compra não encontrados. Retorne para o início.");
        navigate('/meios_de_pagamento');
        return;
      }

      const cartCache = JSON.parse(cartCacheStr);
      const { cart, totalAmount } = cartCache;
      console.log('[Token] Dados do carrinho recuperados:', cartCache);

      // Validar dados do carrinho
      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        console.error('[Token] Carrinho vazio ou inválido');
        toast.error("Carrinho vazio. Retorne para o início.");
        navigate('/meios_de_pagamento');
        return;
      }

      if (!totalAmount || totalAmount <= 0) {
        console.error('[Token] Valor total inválido');
        toast.error("Valor da compra inválido. Retorne para o início.");
        navigate('/meios_de_pagamento');
        return;
      }

      // Converter cart para formato RLIFUND items
      const items = cart.map(product => ({
        ean: product.barcode,
        sku: product.id,
        unit_price: product.price,
        discount: 0,
        quantity: product.quantity || 1,
        name: product.name,
        unit_type: "UN",
        brand: "Unknown",
        manufacturer: "Unknown",
        categories: ["groceries"],
        gross_profit_amount: Math.max(product.price * 0.1, 0.01),
        is_private_label: false,
        is_on_sale: false
      }));

      console.log('[Token] Items convertidos para RLIFUND:', items);

      // Usar o transactionId existente para manter a sessão no backend
      console.log('[Token] Reutilizando transactionId existente para token:', transactionId);
      console.log('[Token] Value total do carrinho:', totalAmount);
      console.log('[Token] Quantidade de items:', items.length);

      // Chamar RLIFUND com payment_option_type: "otp" usando o mesmo transactionId
      const rlifundResponse = await comandoService.enviarComandoRlifund(
        transactionId, 
        "otp", 
        totalAmount.toString(), 
        items
      );
      console.log('[Token] Resposta RLIFUND com OTP recebida:', rlifundResponse);

      // Verificar se a resposta é válida
      if (!rlifundResponse || !rlifundResponse[0]?.response?.data) {
        console.error('[Token] Resposta RLIFUND com OTP inválida:', rlifundResponse);
        toast.error("Erro ao processar checkout com token. Tente novamente.");
        return;
      }

      // Armazenar nova resposta RLIFUND no localStorage
      localStorage.setItem('rlifundResponse', JSON.stringify(rlifundResponse));
      // Não precisa atualizar o transactionId pois está usando o mesmo

      console.log('[Token] Nova resposta RLIFUND armazenada com sucesso');
      console.log('[Token] Usando o mesmo transactionId:', transactionId);

      // Extrair payment_options da resposta OTP
      const otpData = rlifundResponse[0]?.response?.data as any;
      const paymentOptions = otpData?.payment_options || [];
      console.log('[Token] payment_options na nova resposta:', paymentOptions);
      if (Array.isArray(paymentOptions) && paymentOptions.length > 0) {
        // Armazenar opções disponíveis para renderização dinâmica
        setAvailablePaymentOptions(paymentOptions);

        // Extrair valor dinâmico do primeiro item (ou usar lógica específica)
        const firstOption = paymentOptions[0];
        const dynamicValue = otpData?.otp_max_amount || otpData?.value_total || "30,00";
        const formattedAmount = `R$ ${dynamicValue}`;
        setTokenAmount(formattedAmount);
        console.log('[Token] Opções de pagamento encontradas:', paymentOptions.length);
        console.log('[Token] Valor dinâmico extraído:', formattedAmount);
        toast.success("Checkout refeito com sucesso!");
        setTokenModalOpen(true);
      } else {
        console.warn('[Token] Nenhuma opção de pagamento OTP encontrada na resposta');
        console.log('[Token] payment_options array:', paymentOptions);
        toast.error("Não foi encontrado pagamento do tipo OTP para esta transação.");
      }
    } catch (error) {
      console.error('[Token] Erro durante refazer checkout:', error);
      toast.error("Erro ao processar pagamento com token. Tente novamente.");
    } finally {
      setIsTokenLoading(false);
    }
  };
  const handleNoneOption = () => {
    console.log("Usuário retornou para meios de pagamento a partir do modal de token.");
    setTokenModalOpen(false);
    navigate("/meios_de_pagamento");
  };

  // Handle payment option selection in token modal
  const handlePaymentOptionSelect = async (option: string) => {
    console.log(`[Token] Opção selecionada: ${option}`);

    // Get transaction ID from localStorage
    const transactionId = localStorage.getItem('transactionId');
    if (!transactionId) {
      console.error('[Token] TransactionId não encontrado no localStorage');
      toast.error("Erro: ID da transação não encontrado");
      return;
    }
    try {
      setIsTokenLoading(true);
      console.log(`[Token] Chamando RLIDEAL com payment_option: ${option}, transactionId: ${transactionId}`);

      // Call RLIDEAL service with selected payment option
      const rlidealResponse = await comandoService.enviarComandoRlideal(transactionId, option, "2");
      console.log('[Token] Resposta RLIDEAL recebida:', rlidealResponse);

      // Store RLIDEAL response in localStorage
      localStorage.setItem('rlidealResponse', JSON.stringify(rlidealResponse));
      setTokenModalOpen(false);
      toast.success("Opção de pagamento processada com sucesso!");

      // Navigate based on payment option type
      switch (option) {
        case 'dotz':
          console.log('[Token] Navegando para confirmacao_pagamento_token (Dotz)');
          navigate("/confirmacao_pagamento_token");
          break;
        case 'app':
          console.log('[Token] Navegando para confirmacao_pagamento_token (App)');
          navigate("/confirmacao_pagamento_token");
          break;
        case 'outros_pagamentos':
          console.log('[Token] Navegando para otp_data_nascimento (Outros Pagamentos)');
          navigate("/otp_data_nascimento");
          break;
        default:
          console.log('[Token] Opção não reconhecida, navegando para confirmacao_pagamento_token');
          navigate("/confirmacao_pagamento_token");
          break;
      }
    } catch (error) {
      console.error('[Token] Erro ao processar opção de pagamento:', error);
      toast.error("Erro ao processar opção de pagamento. Tente novamente.");
    } finally {
      setIsTokenLoading(false);
    }
  };

  // Handler for the RLIDEAL alert OK button
  const handleRlidealAlertConfirm = () => {
    setRlidealAlertOpen(false);
    navigate("/confirmacao_pagamento_token");
  };

  // Handler for timeout modal actions
  const handleTimeoutRestart = () => {
    console.log('[ConfirmacaoPagamentoAppScreen] Restarting polling after timeout');
    setTimeoutModalOpen(false);
    startPolling();
  };
  const handleTimeoutCancel = () => {
    console.log('[ConfirmacaoPagamentoAppScreen] User cancelled after timeout');
    setTimeoutModalOpen(false);
    navigate('/meios_de_pagamento');
  };
  return <div className="min-h-screen bg-gray-100 p-4 pb-16">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Panel - PDV Modal */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-dotz-laranja text-white p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pagamento</h2>
            <EncerrarAtendimentoButton />
          </div>
          <div className="p-6 text-center">
            <p className="text-lg mb-6">Aguardando pagamento no APP Cliente A.</p>
            {!isOnlineFlow && <div className="flex justify-center my-6">
                <Loader2 className="h-10 w-10 animate-spin text-dotz-laranja" />
              </div>}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              {/* Show different buttons based on polling status */}
              {pollingStatus.status === 'completed' ? (/* Payment completed - show only finalizar pagamento button */
            <Button variant="dotz" className="bg-green-600 hover:bg-green-700" onClick={handleFinalizarPagamento}>
                  Finalizar Pagamento
                </Button>) : (/* Normal state - show token and cancel buttons */
            <>
                  {/* Token Payment Button - Conditionally rendered */}
                  {tokenButtonLoading ? <div className="h-10 w-36 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    </div> : showTokenPaymentButton && <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button variant="token" className="bg-gray-800 hover:bg-gray-700" onClick={handleTokenPaymentClick} disabled={isTokenLoading}>
                               {isTokenLoading ? <>
                                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                   Processando...
                                 </> : "Pagar com Token"}
                             </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Este meio de pagamento requer autenticação por token.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>}
                  <Button variant="outline" className="bg-gray-300 hover:bg-gray-400 text-gray-900" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </>)}
            </div>
          </div>
        </div>

        {/* Right Panel - App Simulator or Polling Status */}
        <div className="flex justify-center">
          {isOnlineFlow ? (/* ONLINE Flow - Polling Status Interface */
        <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md w-full">
              <div className="bg-blue-600 text-white p-4 text-center">
                <h3 className="text-lg font-semibold">Status do Pagamento</h3>
              </div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    {pollingStatus.isPolling ? <RefreshCw className="h-12 w-12 animate-spin text-blue-600" /> : pollingStatus.status === 'completed' ? <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xl">✓</span>
                      </div> : pollingStatus.status === 'error' ? <AlertTriangle className="h-12 w-12 text-red-500" /> : <Clock className="h-12 w-12 text-gray-400" />}
                  </div>
                  
                  <h4 className="text-xl font-semibold mb-2">
                    {pollingStatus.status === 'polling' && 'Aguardando confirmação...'}
                    {pollingStatus.status === 'completed' && 'Pagamento confirmado!'}
                    {pollingStatus.status === 'error' && 'Erro na verificação'}
                    {pollingStatus.status === 'cancelled' && 'Verificação cancelada'}
                    {pollingStatus.status === 'waiting' && 'Preparando verificação...'}
                  </h4>
                  
                  <p className="text-gray-600 mb-4">
                    {pollingStatus.status === 'polling' && 'Verificando status do pagamento no app...'}
                    {pollingStatus.status === 'completed' && 'O pagamento foi processado com sucesso.'}
                    {pollingStatus.status === 'error' && 'Houve um erro ao verificar o status.'}
                    {pollingStatus.status === 'cancelled' && 'A verificação foi interrompida.'}
                    {pollingStatus.status === 'waiting' && 'Aguarde enquanto preparamos a verificação.'}
                  </p>
                </div>

                {/* Polling Information */}
                {pollingStatus.isPolling && <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <div className="text-sm text-blue-800">
                      <p className="mb-1">
                        <strong>Tentativa:</strong> {pollingStatus.attempts}
                      </p>
                      {pollingStatus.lastAttemptTime && <p className="mb-1">
                          <strong>Última verificação:</strong> {pollingStatus.lastAttemptTime.toLocaleTimeString()}
                        </p>}
                       <p className="text-xs text-blue-600 mt-2">
                         ⏱️ Verificação automática a cada 10 segundos
                       </p>
                    </div>
                  </div>}

                {/* Error Information */}
                {pollingStatus.status === 'error' && pollingStatus.error && <div className="bg-red-50 p-4 rounded-lg mb-4">
                    <div className="text-sm text-red-800">
                      <p><strong>Erro:</strong> {pollingStatus.error}</p>
                    </div>
                  </div>}

                {/* Next Step Information */}
                {pollingStatus.nextStepData && <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="text-sm text-gray-800">
                      <p><strong>Status atual:</strong> {pollingStatus.nextStepData.description}</p>
                      <p><strong>Código:</strong> {pollingStatus.nextStepData.code}</p>
                    </div>
                  </div>}

                {/* Cancel Button */}
                {pollingStatus.isPolling && <Button variant="outline" className="w-full" onClick={handleCancel}>
                    Cancelar Verificação
                  </Button>}
              </div>
            </div>) : (/* OFFLINE Flow - Original App Simulator */
        <div className="bg-white rounded-3xl border-2 border-gray-300 shadow-xl overflow-hidden max-w-xs w-full">
              <div className="aspect-w-9 aspect-h-16">
                <div className="p-4">
                  {/* App Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <button className="text-gray-700 mr-2">
                        &larr;
                      </button>
                      <h3 className="text-base font-medium">Wallet by <span className="font-bold">d<span className="text-dotz-laranja">o</span>tz</span></h3>
                    </div>
                    <button className="text-gray-700">
                      ✕
                    </button>
                  </div>

                  {/* Payment Info */}
                  <div className="text-center mb-6">
                    <p className="text-gray-600 mb-1">Você está pagando</p>
                    <p className="text-2xl font-bold mb-1">R$ 68,93</p>
                    <p className="text-sm text-gray-600">para Americanas S. SP Market</p>
                  </div>

                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Payment Method */}
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">Forma de pagamento:</p>
                    <button className="text-sm text-dotz-laranja font-medium">Alterar</button>
                  </div>

                  {/* Dotz Balance */}
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm">Saldo Dotz</p>
                    <div className="text-right">
                      <p className="text-sm font-semibold">R$ 20,00</p>
                      <p className="text-xs text-gray-500">(Dz 200)</p>
                    </div>
                  </div>

                  {/* Credit */}
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm">Crédito Dz Parcela</p>
                    <div className="text-right">
                      <p className="text-sm font-semibold">R$ 48,93</p>
                      <p className="text-xs text-gray-500">(3X de R$ 16,92)</p>
                    </div>
                  </div>

                  {/* Pending Value */}
                  <div className="flex justify-between items-center py-3 px-2 bg-gray-50 rounded-lg mb-4">
                    <div className="flex items-center">
                      <span className="mr-2">🔔</span>
                      <p className="text-sm">Valor pendente</p>
                    </div>
                    <p className="text-sm font-semibold">R$ 0,00</p>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    Pague o valor pendente diretamente no caixa.
                  </p>

                  {/* Points Rewards */}
                  <div className="bg-orange-50 p-3 rounded-lg mb-6 flex items-start">
                    <div className="bg-dotz-laranja text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">
                      <span>●</span>
                    </div>
                    <div>
                      <p className="text-sm">Você vai ganhar <span className="font-bold">Dz 60</span> nesta compra</p>
                    </div>
                  </div>

                  {/* Legal Text */}
                  <p className="text-xs text-gray-600 mb-6">
                    Ao avançar, você concorda com o contrato de <span className="text-dotz-laranja">Cédula de Crédito Bancário - CCB</span>
                  </p>

                  {/* Pay Button */}
                  <Button className="w-full bg-dotz-laranja hover:bg-dotz-laranja/90 text-white font-medium rounded-full py-6" onClick={handlePaymentConfirmation}>
                    Pagar
                  </Button>
                </div>
              </div>
            </div>)}
        </div>
      </div>


      {/* Navigation Guide Component */}
      <GuiaDeNavegacaoAPI />
      
      {/* Technical Footer Component */}
      <TechnicalFooter requestData={technicalRequestData} responseData={technicalResponseData} previousRequestData={technicalPreviousRequestData} isLoading={isLoading} slug="RLIDEALRLIWAIT" loadOnMount={false} sourceScreen="confirmacao_pagamento_app" previousServiceName="RLIDEAL" />
      
      {/* First Alert Dialog - RLIFUND Break Step */}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent className="p-0 overflow-hidden max-w-md">
          <AlertDialogHeader className="bg-dotz-laranja text-white px-6 py-4">
            <AlertDialogTitle className="text-lg font-semibold text-center">Atenção!!!</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="p-6">
            <p className="text-center mb-6">
              Nesta etapa já há um checkout esperando pagamento, portanto, é necessário fazer uso de um break step, neste caso chamar o serviço RLIFUND novamente.
            </p>
            <div className="flex justify-center">
              <AlertDialogAction className="bg-dotz-laranja hover:bg-dotz-laranja/90 text-white" onClick={handleAlertConfirm}>
                OK
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* New Alert Dialog - RLIDEAL Validation */}
      <AlertDialog open={rlidealAlertOpen} onOpenChange={setRlidealAlertOpen}>
        <AlertDialogContent className="p-0 overflow-hidden max-w-md">
          <AlertDialogHeader className="bg-dotz-laranja text-white px-6 py-4">
            <div className="flex items-center justify-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle className="text-lg font-semibold">Atenção</AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <div className="p-6">
            <p className="text-center mb-6">
              Nesta etapa é necessário fazer uma nova chamada ao serviço RLIDEAL para enviar novamente a cesta de produtos e verificar se é necessário solicitação de autenticação.
            </p>
            <div className="flex justify-center">
              <AlertDialogAction className="bg-dotz-laranja hover:bg-dotz-laranja/90 text-white" onClick={handleRlidealAlertConfirm}>
                OK
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Token Payment Modal */}
      <Dialog open={tokenModalOpen} onOpenChange={setTokenModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold mb-4">
              Escolha uma opção:
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Dynamic buttons based on available payment options */}
            {availablePaymentOptions.map((option, index) => <Button key={option.option} onClick={() => handlePaymentOptionSelect(option.option)} disabled={isTokenLoading} className="w-full bg-dotz-laranja hover:bg-dotz-laranja/90 text-white py-3 text-base text-left disabled:opacity-50 disabled:cursor-not-allowed">
                {isTokenLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    Processando...
                  </>
                ) : (
                  <>{index + 1}. {option.message}</>
                )}
              </Button>)}
            
            {/* Always show "Nenhum" option */}
            <Button onClick={handleNoneOption} variant="outline" disabled={isTokenLoading} className="w-full py-3 text-base border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              {availablePaymentOptions.length + 1}. Nenhum
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Timeout Modal */}
      <AlertDialog open={timeoutModalOpen} onOpenChange={setTimeoutModalOpen}>
        <AlertDialogContent className="p-0 overflow-hidden max-w-md">
          <AlertDialogHeader className="bg-red-600 text-white px-6 py-4">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5" />
              <AlertDialogTitle className="text-lg font-semibold">Tempo Esgotado</AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <div className="p-6">
            <p className="text-center mb-6">
              Não foi possível detectar o pagamento em 5 minutos. Deseja tentar novamente?
            </p>
            <div className="flex justify-center space-x-3">
              <AlertDialogAction className="bg-dotz-laranja hover:bg-dotz-laranja/90 text-white" onClick={handleTimeoutRestart}>
                Tentar Novamente
              </AlertDialogAction>
              <Button variant="outline" onClick={handleTimeoutCancel}>
                Cancelar
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default ConfirmacaoPagamentoAppScreen;