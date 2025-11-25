import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PdvLayout from "@/components/PdvLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import TechnicalFooter from "@/components/TechnicalFooter";
import { consultaFluxoService } from "@/services/consultaFluxoService";
import { comandoService } from "@/services/comandoService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import EncerrarAtendimentoButton from "@/components/EncerrarAtendimentoButton";
import { useUserSession } from "@/hooks/useUserSession";
import { createLogger } from '@/utils/logger';

const log = createLogger('TelefoneScreen');

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
  const { ambiente } = useUserSession();

  useEffect(() => {
    const fetchApiData = async () => {
      try {
        // Get stored CPF from localStorage
        const cpf = localStorage.getItem('cpfDigitado');
        
        // Fallback if CPF is not available
        if (!cpf) {
          log.error('CPF não encontrado. Redirecionando para a etapa de identificação.');
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
            
            // Extract transaction_id from the response (array format)
            if (Array.isArray(onlineResponse) && onlineResponse[0]?.response?.data?.transaction_id) {
              setTransactionId(onlineResponse[0].response.data.transaction_id);
            }
          } catch (parseError) {
            log.error('Erro ao fazer parse do onlineResponse:', parseError);
          }
        }

        setTipoSimulacao(tipoSim);
        
        const data = await consultaFluxoService.consultarFluxoDetalhe('RLIINFORLICELL');
        setApiData(data);
      } catch (error) {
        log.error("Erro ao consultar detalhes do fluxo:", error);
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
    log.info(`Celular informado: ${formatTelefone(telefone)}`);
    setLastError(null);
    
    // Validação básica
    if (telefone.length < 10) {
      toast.error("Por favor, digite um telefone válido com pelo menos 10 dígitos");
      return;
    }

    // Verificar se estamos em modo ONLINE e se temos transaction_id
    if (tipoSimulacao !== "OFFLINE" && transactionId) {
      setIsSubmitLoading(true);
      const ambienteTexto = ambiente === "producao" 
        ? "PRODUÇÃO" 
        : ambiente === "homologacao" 
          ? "homologação" 
          : "homologação"; // fallback
      
      setLoadingMessage(`Processando telefone no ambiente de ${ambienteTexto}...`);
      
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

        log.debug('Response RLICELL:', response);
        
        // Store response for next screen
        localStorage.setItem('rlicellResponse', JSON.stringify(response));
        
        toast.success("Telefone processado com sucesso!");
        
        // Navigate based on next_step or use default flow
        if (Array.isArray(response) && response[0]?.response?.data?.next_step?.length > 0) {
          const nextStep = response[0].response.data.next_step[0];
          log.debug('Next step:', nextStep);
          // Navigate based on the next step logic
          navigate("/transicao-cadastro?from=telefone");
        } else {
          navigate("/transicao-cadastro?from=telefone");
        }
        
      } catch (error) {
        log.error('Erro ao enviar comando RLICELL:', error);
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
    <>
      <PdvLayout className="flex flex-col items-center justify-center pb-16">
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Informe seu Celular</h2>
          </div>
          
          {/* Alert for production environment */}
          {ambiente === "producao" && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
              <div className="flex items-center">
                <span className="text-red-600 font-semibold text-sm">
                  ⚠️ ATENÇÃO: AMBIENTE DE PRODUÇÃO
                </span>
              </div>
              <p className="text-red-600 text-xs mt-1">
                O telefone informado será cadastrado no ambiente produtivo
              </p>
            </div>
          )}

          {/* Alert for homologation environment */}
          {ambiente === "homologacao" && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <div className="flex items-center">
                <span className="text-yellow-700 font-semibold text-sm">
                  ⚠️ Atenção: ambiente de homologação
                </span>
              </div>
              <p className="text-yellow-700 text-xs mt-1">
                O telefone informado será cadastrado no ambiente de testes
              </p>
            </div>
          )}
          
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

      {/* Encerrar Atendimento - Fixed bottom right */}
      <div className="fixed bottom-6 right-6 z-50">
        <EncerrarAtendimentoButton />
      </div>

      </PdvLayout>
      
      {/* Technical Footer Component */}
      <TechnicalFooter
        requestData={apiDebugInfo ? JSON.stringify(apiDebugInfo, null, 2) : apiData.request_servico}
        responseData={previousResponse && Array.isArray(previousResponse) && previousResponse[0]?.response 
          ? JSON.stringify(previousResponse[0].response, null, 2) 
          : apiData.response_servico_anterior}
        isLoading={isLoading}
        slug="RLIINFORLICELL"
        loadOnMount={!!apiData.request_servico}
        sourceScreen="telefone"
      />
    </>
  );
};

export default TelefoneScreen;
