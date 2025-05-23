
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useNavigate, useLocation } from "react-router-dom";
import TechnicalDocumentation from "@/components/technical/TechnicalDocumentation";
import GuiaDeNavegacaoAPI from "@/components/GuiaDeNavegacaoAPI";
import { usePaymentOption } from "@/context/PaymentOptionContext";
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
  
  // Check if coming from token screen
  const comingFromTokenScreen = location.state?.fromTokenScreen || false;
  
  // Payment amounts based on selected option
  const [paymentAmount, setPaymentAmount] = useState({ encargos: "68,93", recebido: "68,93" });
  
  // Technical documentation states
  const [apiData, setApiData] = useState<{
    request_servico?: string | null;
    response_servico_anterior?: string | null;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [documentationSlug, setDocumentationSlug] = useState("RLIWAITRLIPAYS");

  // Set payment amount based on selected option and navigation source
  useEffect(() => {
    if (comingFromTokenScreen) {
      // Special values when coming from token screen
      setPaymentAmount({ encargos: "30,00", recebido: "30,00" });
      setDocumentationSlug("RLIAUTHRLIPAYS");
      console.log("Origem: tela de token. Usando valores R$ 30,00 e documentação específica RLIAUTHRLIPAYS.");
    } else if (selectedPaymentOption === "livelo") {
      setPaymentAmount({ encargos: "60,00", recebido: "60,00" });
      console.log("Opção selecionada: 2 – Aplicando valores na confirmação.");
    } else if (selectedPaymentOption === "dotz") {
      setPaymentAmount({ encargos: "3,00", recebido: "3,00" });
      console.log("Opção selecionada: 3 – Aplicando valores na confirmação.");
      // Set the documentation slug for option 3 if not from token screen
      if (!comingFromTokenScreen) {
        setDocumentationSlug("RLIDEALRLIPAYS");
      }
    } else {
      setPaymentAmount({ encargos: "68,93", recebido: "68,93" });
      console.log("Opção selecionada: 1 – Aplicando valores na confirmação.");
    }
  }, [selectedPaymentOption, comingFromTokenScreen]);

  // Fetch API data for technical documentation
  useEffect(() => {
    const fetchApiData = async () => {
      try {
        const url = `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/consultaFluxoDetalhe?SLUG=${documentationSlug}`;
        console.log(`Carregando documentação técnica para ${documentationSlug}`);
        
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
  }, [documentationSlug]);

  const handleRestartFlow = () => {
    navigate('/welcome');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
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
                  <span>68,93</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Desconto (R$):</span>
                  <span>0,00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Encargos (R$):</span>
                  <span className="text-red-600 font-medium">{paymentAmount.encargos}</span>
                </div>
              </div>
              
              {/* Total */}
              <div className="bg-gray-200 p-3 mt-4 flex justify-between">
                <span className="font-medium">Recebido (R$):</span>
                <span className="font-medium">{paymentAmount.recebido}</span>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-red-600 text-white p-3 text-center">
              <p>Sem troco</p>
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

        {/* Technical Documentation - Uses the dynamically set slug based on the payment option and navigation source */}
        <div className="mt-8">
          <TechnicalDocumentation 
            slug={documentationSlug}
            loadOnMount={true}
          />
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
    </div>
  );
};

export default ConfirmacaoPagamentoScreen;
