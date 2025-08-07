import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PdvLayout from "@/components/PdvLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import TechnicalDocumentation from "@/components/technical/TechnicalDocumentation";
import { consultaFluxoService } from "@/services/consultaFluxoService";
import { comandoService } from "@/services/comandoService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const TelefoneScreen = () => {
  const [telefone, setTelefone] = useState("");
  const [apiData, setApiData] = useState<{
    request_servico?: any;
    response_servico_anterior?: any;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [apiDebugInfo, setApiDebugInfo] = useState<any>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [previousResponse, setPreviousResponse] = useState<any>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [tipoSimulacao, setTipoSimulacao] = useState<string>("OFFLINE");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApiData = async () => {
      try {
        // Get stored CPF from localStorage
        const cpf = localStorage.getItem('cpfDigitado');
        
        // Fallback if CPF is not available
        if (!cpf) {
          console.error('CPF não encontrado. Redirecionando para a etapa de identificação.');
          navigate('/cpf');
          return;
        }

        // Get previous response data (RLIINFO response from CPF screen)
        const onlineResponseStr = localStorage.getItem('onlineResponse');
        const tipoSim = localStorage.getItem('tipo_simulacao') || 'OFFLINE';
        
        if (onlineResponseStr) {
          try {
            const onlineResponse = JSON.parse(onlineResponseStr);
            setPreviousResponse(onlineResponse);
            
            // Extract transaction_id from the response
            if (onlineResponse?.response?.data?.transaction_id) {
              setTransactionId(onlineResponse.response.data.transaction_id);
            }
          } catch (parseError) {
            console.error('Erro ao fazer parse do onlineResponse:', parseError);
          }
        }

        setTipoSimulacao(tipoSim);
        
        const data = await consultaFluxoService.consultarFluxoDetalhe('RLIINFORLICELL');
        setApiData(data);
      } catch (error) {
        console.error("Erro ao consultar detalhes do fluxo:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApiData();
  }, [navigate]);

  const handleKeyPress = (value: string) => {
    if (value === "CLEAR") {
      setTelefone("");
    } else if (value === "BACKSPACE") {
      setTelefone(prev => prev.slice(0, -1));
    } else if (telefone.length < 11) {
      setTelefone(prev => prev + value);
    }
  };

  const handleSubmit = async () => {
    console.log(`Celular informado: ${formatTelefone(telefone)}`);
    setLastError(null);
    
    // Validação básica
    if (telefone.length < 10) {
      toast.error("Por favor, digite um telefone válido com pelo menos 10 dígitos");
      return;
    }

    // Verificar se estamos em modo ONLINE e se temos transaction_id
    if (tipoSimulacao !== "OFFLINE" && transactionId) {
      setIsSubmitLoading(true);
      setLoadingMessage("Processando telefone no ambiente de homologação...");
      
      const startTime = Date.now();
      
      try {
        const response = await comandoService.enviarComandoRlicell(telefone, transactionId);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Store debug information
        setApiDebugInfo({
          request: {
            comando: "RLICELL",
            telefone,
            id_transaction: transactionId
          },
          response,
          timing: {
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            responseTime: `${responseTime}ms`
          },
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': '***hidden***'
          }
        });

        console.log('Response RLICELL:', response);
        
        // Store response for next screen
        localStorage.setItem('rlicellResponse', JSON.stringify(response));
        
        toast.success("Telefone processado com sucesso!");
        
        // Navigate based on next_step or use default flow
        if (response.response?.data?.next_step?.length > 0) {
          const nextStep = response.response.data.next_step[0];
          console.log('Next step:', nextStep);
          // Navigate based on the next step logic
          navigate("/transicao-cadastro?from=telefone");
        } else {
          navigate("/transicao-cadastro?from=telefone");
        }
        
      } catch (error) {
        console.error('Erro ao enviar comando RLICELL:', error);
        setLastError(error instanceof Error ? error.message : 'Erro desconhecido');
        toast.error("Erro ao processar telefone. Tente novamente.");
      } finally {
        setIsSubmitLoading(false);
        setLoadingMessage("");
      }
    } else {
      // Modo OFFLINE ou sem transaction_id - usar fluxo original
      navigate("/transicao-cadastro?from=telefone");
    }
  };

  const handleSkip = () => {
    // Add query parameter when skipping
    navigate("/scan?from=telefone");
  };

  const formatTelefone = (value: string) => {
    if (!value) return "";
    
    value = value.replace(/\D/g, "");
    if (value.length <= 11) {
      if (value.length > 2) {
        value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
      }
      if (value.length > 10) {
        value = value.substring(0, 10) + "-" + value.substring(10);
      }
    }
    return value;
  };

  const NumPad = () => {
    const keys = [
      ["7", "8", "9"],
      ["4", "5", "6"],
      ["1", "2", "3"],
      ["BACKSPACE", "0", "ENTER"]
    ];

    return (
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
        {keys.flat().map((key) => {
          if (key === "BACKSPACE") {
            return (
              <Button
                key={key}
                variant="outline"
                className="h-16 bg-gray-200 hover:bg-gray-300 text-black"
                onClick={() => handleKeyPress("BACKSPACE")}
                disabled={isSubmitLoading}
              >
                ←
              </Button>
            );
          } else if (key === "ENTER") {
            return (
              <Button
                key={key}
                className="h-16 bg-dotz-laranja hover:bg-dotz-laranja/90 text-white"
                disabled={telefone.length < 10 || isSubmitLoading}
                onClick={handleSubmit}
              >
                {isSubmitLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processando...</span>
                  </div>
                ) : (
                  "ENTRA"
                )}
              </Button>
            );
          } else {
            return (
              <Button
                key={key}
                variant="outline"
                className="h-16 text-xl font-medium bg-white hover:bg-gray-100"
                onClick={() => handleKeyPress(key)}
                disabled={isSubmitLoading}
              >
                {key}
              </Button>
            );
          }
        })}
      </div>
    );
  };

  return (
    <PdvLayout className="flex flex-col items-center justify-center">
      {isSubmitLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-dotz-laranja" />
            <p className="text-lg font-medium">{loadingMessage}</p>
            <p className="text-sm text-gray-600 mt-2">Aguarde...</p>
          </div>
        </div>
      )}

      <Card className="w-full max-w-md p-6 flex flex-col items-center">
        <div className="w-full mb-8">
          <h2 className="text-2xl font-bold text-center mb-6">Informe seu Celular</h2>
          
          {lastError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{lastError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setLastError(null)}
              >
                Tentar novamente
              </Button>
            </div>
          )}
          
          <Input
            className="text-center text-xl h-14 mb-6"
            value={formatTelefone(telefone)}
            readOnly
            placeholder="Digite seu celular"
          />
          <NumPad />
          
          <div className="mt-6 flex justify-center">
            <Button 
              variant="outline" 
              className="text-gray-600" 
              onClick={handleSkip}
              disabled={isSubmitLoading}
            >
              Não Informar
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-8 w-full max-w-3xl">
        {/* Technical documentation with dynamic cURL and previous response */}
        <div className="space-y-6">
          {/* Dynamic cURL display */}
          {tipoSimulacao !== "OFFLINE" && (
            <div className="border border-gray-200 rounded-md shadow overflow-hidden">
              <div className="bg-white px-4 py-3 font-medium border-b">
                🔧 Comando RLICELL - Configuração da Chamada
              </div>
              <div className="p-4 bg-white">
                <div className="space-y-2">
                  <p className="text-gray-600">Chamada para o webhook do simulador com telefone informado:</p>
                  <pre className="whitespace-pre-wrap text-xs p-3 bg-gray-100 rounded border overflow-x-auto">
{`curl --request POST \\
  --url 'https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/comando' \\
  --header 'Content-Type: application/json' \\
  --header 'x-api-key: 0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975' \\
  --data '{
    "comando": "RLICELL",
    "telefone": "${telefone || '[TELEFONE_DO_USUARIO]'}",
    "id_transaction": "${transactionId || '[TRANSACTION_ID_DO_SERVICO_ANTERIOR]'}"
  }'`}
                  </pre>
                  <p className="text-xs text-gray-500 mt-2">
                    📋 <strong>Fluxo:</strong> Frontend → Webhook → API Externa de Homologação Dotz
                  </p>
                  <p className="text-xs text-gray-500">
                    ⏱️ <strong>Timeout:</strong> 30 segundos | <strong>Transaction ID:</strong> {transactionId || 'Não encontrado'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* API Debug Information */}
          {apiDebugInfo && (
            <div className="border border-gray-200 rounded-md shadow overflow-hidden">
              <div className="bg-white px-4 py-3 font-medium border-b">
                🔍 Informações de Debug da Última Chamada
              </div>
              <div className="p-4 bg-white">
                <pre className="text-xs font-mono bg-gray-100 p-3 rounded overflow-x-auto">
                  {JSON.stringify(apiDebugInfo, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <TechnicalDocumentation
            requestData={apiData.request_servico}
            responseData={previousResponse ? JSON.stringify(previousResponse, null, 2) : apiData.response_servico_anterior}
            isLoading={isLoading}
            slug="RLIINFORLICELL"
          />
        </div>
      </div>
    </PdvLayout>
  );
};

export default TelefoneScreen;
