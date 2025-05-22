import { useState, useEffect } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import TechnicalDocumentation from "@/components/technical/TechnicalDocumentation";
import GuiaDeNavegacaoAPI from "@/components/GuiaDeNavegacaoAPI";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const ConfirmacaoPagamentoAppScreen = () => {
  const navigate = useNavigate();
  // Technical documentation states
  const [apiData, setApiData] = useState<{
    request_servico?: string | null;
    response_servico_anterior?: string | null;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Token payment button visibility state
  const [showTokenPaymentButton, setShowTokenPaymentButton] = useState(false);
  const [tokenButtonLoading, setTokenButtonLoading] = useState(true);
  
  // Token payment modal state
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  
  // Alert dialog state - New addition
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  
  // Get client name from localStorage (fallback to empty string if not available)
  const clientName = localStorage.getItem('nomeCliente') || '';

  // Fetch API data for technical documentation
  useEffect(() => {
    const fetchApiData = async () => {
      try {
        const url = `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/consultaFluxoDetalhe?SLUG=RLIDEALRLIWAIT`;
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

  // New effect to check if token payment should be enabled
  useEffect(() => {
    const checkTokenPaymentEligibility = async () => {
      try {
        setTokenButtonLoading(true);
        
        // Get stored CPF from localStorage
        const cpf = localStorage.getItem('cpfDigitado');
        
        // Fallback if CPF is not available
        if (!cpf) {
          console.error('CPF não encontrado para verificação de pagamento por token.');
          setShowTokenPaymentButton(false);
          return;
        }
        
        const url = `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/consultaFluxo?cpf=${cpf}&SLUG=RLIWAIT`;
        console.log("Verificando elegibilidade para pagamento com token:", url);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error in token eligibility request: ${response.status}`);
        }
        
        const data = await response.json();
        const canUseToken = data.permitir_pagamento_token === true;
        setShowTokenPaymentButton(canUseToken);
        
        // Log the result for debugging
        console.log(`permitir_pagamento_token = ${canUseToken ? 'true ➝ Botão exibido' : 'false ➝ Botão oculto'}`);
        
      } catch (error) {
        console.error("Error checking token payment eligibility:", error);
        // Fail-safe: hide button if there's an error
        setShowTokenPaymentButton(false);
      } finally {
        setTokenButtonLoading(false);
      }
    };
    
    checkTokenPaymentEligibility();
  }, []);

  const handlePaymentConfirmation = () => {
    navigate("/confirmacao_pagamento");
  };
  
  const handleCancel = () => {
    navigate("/meios_de_pagamento");
  };
  
  // Updated to show alert dialog first
  const handleTokenPaymentClick = () => {
    console.log("Alerta exibido: necessário executar break step via RLIFUND antes do token.");
    setAlertDialogOpen(true);
  };
  
  // Handler for when alert OK button is clicked
  const handleAlertConfirm = () => {
    setAlertDialogOpen(false);
    setTokenModalOpen(true);
  };
  
  const handleNoneOption = () => {
    console.log("Usuário retornou para meios de pagamento a partir do modal de token.");
    setTokenModalOpen(false);
    navigate("/meios_de_pagamento");
  };

  // Handle option 1 in token payment modal - navigate to token screen
  const handleTokenAmountOption = () => {
    setTokenModalOpen(false);
    navigate("/confirmacao_pagamento_token");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Panel - PDV Modal */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-dotz-laranja text-white p-4 text-center">
            <h2 className="text-xl font-semibold">Pagamento Cliente A</h2>
          </div>
          <div className="p-6 text-center">
            <p className="text-lg mb-6">Aguardando pagamento no APP Cliente A.</p>
            <div className="flex justify-center my-6">
              <Loader2 className="h-10 w-10 animate-spin text-dotz-laranja" />
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              {/* Token Payment Button - Conditionally rendered */}
              {tokenButtonLoading ? (
                <div className="h-10 w-36 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                </div>
              ) : (
                showTokenPaymentButton && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="token"
                          className="bg-gray-800 hover:bg-gray-700"
                          onClick={handleTokenPaymentClick}
                        >
                          Pagar com Token
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Este meio de pagamento requer autenticação por token.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              )}
              <Button 
                variant="outline" 
                className="bg-gray-300 hover:bg-gray-400 text-gray-900"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - App Simulator */}
        <div className="flex justify-center">
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
                <Button 
                  className="w-full bg-dotz-laranja hover:bg-dotz-laranja/90 text-white font-medium rounded-full py-6"
                  onClick={handlePaymentConfirmation}
                >
                  Pagar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Documentation - Added below the main content */}
      <div className="w-full max-w-6xl mx-auto mt-8">
        <TechnicalDocumentation 
          requestData={apiData.request_servico} 
          responseData={apiData.response_servico_anterior}
          isLoading={isLoading}
          slug="RLIDEALRLIWAIT"
        />
      </div>

      {/* Navigation Guide Component */}
      <GuiaDeNavegacaoAPI />
      
      {/* Alert Dialog - New Addition */}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent 
          className="p-0 overflow-hidden max-w-md" 
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <AlertDialogHeader className="bg-dotz-laranja text-white px-6 py-4">
            <AlertDialogTitle className="text-lg font-semibold text-center">Atenção!!!</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="p-6">
            <p className="text-center mb-6">
              Nesta etapa já há um checkout esperando pagamento, portanto, é necessário fazer uso de um break step, neste caso chamar o serviço RLIFUND novamente.
            </p>
            <div className="flex justify-center">
              <AlertDialogAction 
                className="bg-dotz-laranja hover:bg-dotz-laranja/90 text-white"
                onClick={handleAlertConfirm}
              >
                OK
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Token Payment Modal */}
      <Dialog open={tokenModalOpen} onOpenChange={setTokenModalOpen}>
        <DialogContent className="p-0 overflow-hidden max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="bg-dotz-laranja text-white px-6 py-4">
            <DialogTitle className="text-lg font-semibold text-center">Pagamento com Token</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-center text-lg mb-6">
              {clientName ? `${clientName}, você quer pagar com seus pontos?` : 'Você quer pagar com seus pontos?'}
            </p>
            <div className="space-y-4">
              <Button 
                className="w-full bg-dotz-laranja hover:bg-dotz-laranja/90 text-white"
                onClick={handleTokenAmountOption}
              >
                1. Até R$30 com token
              </Button>
              <Button 
                variant="cancel" 
                className="w-full"
                onClick={handleNoneOption}
              >
                4. Nenhum
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfirmacaoPagamentoAppScreen;
