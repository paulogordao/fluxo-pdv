
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PdvLayout from "@/components/PdvLayout";
import UserProfileButton from "@/components/UserProfileButton";
import TestUsersSidebar from "@/components/TestUsersSidebar";
import { useUserSession } from "@/hooks/useUserSession";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Loader2, Clock, AlertCircle, Shuffle } from "lucide-react";
import TechnicalFooter from "@/components/TechnicalFooter";
import { consultaFluxoService } from "@/services/consultaFluxoService";
import { comandoService } from "@/services/comandoService";

const CpfScreen = () => {
  const [cpf, setCpf] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [apiDebugInfo, setApiDebugInfo] = useState<any>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { userName, companyName, tipo_simulacao, isLoading: sessionLoading } = useUserSession();

  const handleKeyPress = (value: string) => {
    if (value === "CLEAR") {
      setCpf("");
    } else if (value === "BACKSPACE") {
      setCpf(prev => prev.slice(0, -1));
    } else if (cpf.length < 11) {
      setCpf(prev => prev + value);
    }
  };

  const handleCpfSelect = (selectedCpf: string) => {
    setCpf(selectedCpf);
    toast.success(`CPF ${formatCPF(selectedCpf)} selecionado!`);
  };

  const generateValidCPF = (): string => {
    // Generate 9 random digits
    const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
    
    // Calculate first verification digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }
    let firstDigit = (sum * 10) % 11;
    if (firstDigit === 10) firstDigit = 0;
    
    // Calculate second verification digit
    sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (11 - i);
    }
    sum += firstDigit * 2;
    let secondDigit = (sum * 10) % 11;
    if (secondDigit === 10) secondDigit = 0;
    
    // Return complete CPF as string
    return [...digits, firstDigit, secondDigit].join('');
  };

  const handleGenerateCPF = () => {
    if (isLoading) return;
    
    const validCPF = generateValidCPF();
    setCpf(validCPF);
    toast.success(`CPF válido gerado: ${formatCPF(validCPF)}`);
  };

  const handleSubmit = async () => {
    if (cpf.length !== 11) return;
    
    setIsLoading(true);
    setLastError(null);
    setApiDebugInfo(null);
    
    const startTime = Date.now();
    console.log(`Cliente identificado com CPF: ${formatCPF(cpf)}`);
    
    try {
      // Store the CPF in localStorage for future use
      localStorage.setItem('cpfDigitado', cpf);
      
      // Check if simulation type is OFFLINE or ONLINE
      if (tipo_simulacao && tipo_simulacao !== "OFFLINE") {
        // ONLINE mode - use new comando service
        setLoadingMessage("Processando CPF no ambiente de homologação...");
        console.log("Modo ONLINE detectado - usando serviço de comando");
        
        const requestData = { comando: 'RLIINFO', cpf };
        const requestTime = new Date().toISOString();
        
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 30000);
        });
        
        const response = await Promise.race([
          comandoService.enviarComando('RLIINFO', cpf),
          timeoutPromise
        ]) as any; // Type assertion needed for Promise.race with timeout
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Store debug information
        setApiDebugInfo({
          request: {
            url: 'https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/comando',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': '0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975'
            },
            body: requestData,
            timestamp: requestTime
          },
          response: response,
          performance: {
            responseTime: `${responseTime}ms`,
            status: 'success'
          }
        });
        
        // Store response data for future use
        localStorage.setItem('onlineResponse', JSON.stringify(response));
        localStorage.setItem('transactionId', response[0].response.data.transaction_id);
        localStorage.setItem('tipo_simulacao', tipo_simulacao);
        
        // Show success toast with response time
        toast.success(`CPF processado com sucesso! (${responseTime}ms)`);
        
        // Navigate based on next_step
        const nextStep = response[0].response.data.next_step[0];
        if (nextStep) {
          if (nextStep.description === "RLICELL") {
            navigate("/telefone");
          } else if (nextStep.description === "RLIFUND") {
            navigate("/scan?from=cpf");
          } else {
            console.warn(`Next step não reconhecido: ${nextStep.description}`);
            navigate("/scan?from=cpf");
          }
        } else {
          console.warn("Next step não encontrado na resposta");
          navigate("/scan?from=cpf");
        }
      } else {
        // OFFLINE mode - use existing consultaFluxo service
        setLoadingMessage("Processando CPF em modo offline...");
        console.log("Modo OFFLINE detectado - usando serviço consultaFluxo");
        
        const data = await consultaFluxoService.consultarFluxo(cpf, 'RLIINFO');
        console.log("Resposta consultaFluxo (OFFLINE):", data);
        
        // Store offline response data for future use and debugging
        localStorage.setItem('offlineResponse', JSON.stringify(data));
        localStorage.setItem('tipo_simulacao', 'OFFLINE');
        
        // Store debug information for offline mode
        setApiDebugInfo({
          request: {
            url: 'offline-consultaFluxo',
            method: 'consultarFluxo',
            body: { cpf, slug: 'RLIINFO' },
            timestamp: new Date().toISOString()
          },
          response: data,
          performance: {
            responseTime: `${Date.now() - startTime}ms`,
            status: 'success'
          }
        });
        
        // Extract SLUG for next step determination
        const slug = data.SLUG;
        console.log(`SLUG recebido: ${slug}`);
        
        // Consult detailed flow information
        let nextStepNavigation = "/scan?from=cpf"; // default fallback
        
        if (slug) {
          try {
            console.log(`Consultando detalhes do fluxo para SLUG: ${slug}`);
            const detalhes = await consultaFluxoService.consultarFluxoDetalhe(slug);
            console.log("Detalhes do fluxo:", detalhes);
            
            // Determine navigation based on SLUG content and detailed response
            if (slug.includes('LICELL') || data.pedir_telefone) {
              nextStepNavigation = "/telefone";
              console.log("Navegando para /telefone - LICELL detectado ou pedir_telefone=true");
            } else if (slug.includes('LIFUND')) {
              nextStepNavigation = "/scan?from=cpf";
              console.log("Navegando para /scan - LIFUND detectado");
            } else {
              console.log(`SLUG não reconhecido: ${slug}, usando navegação padrão: /scan`);
            }
          } catch (error) {
            console.error("Erro ao consultar detalhes do fluxo:", error);
            console.log("Usando navegação baseada apenas em pedir_telefone como fallback");
            
            // Fallback to simple pedir_telefone logic
            if (data.pedir_telefone) {
              nextStepNavigation = "/telefone";
            }
          }
        } else {
          console.log("SLUG não encontrado na resposta, usando navegação baseada em pedir_telefone");
          if (data.pedir_telefone) {
            nextStepNavigation = "/telefone";
          }
        }
        
        toast.success("CPF processado com sucesso!");
        console.log(`Navegando para: ${nextStepNavigation}`);
        navigate(nextStepNavigation);
      }
    } catch (error: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.error("Erro ao processar CPF:", error);
      
      let errorMessage = "Erro ao processar seu CPF. Tente novamente.";
      let technicalError = error.message;
      
      if (error.message === 'TIMEOUT') {
        errorMessage = "Timeout: O serviço de homologação não respondeu em tempo hábil (30s)";
        technicalError = "Timeout após 30 segundos - serviço de homologação indisponível";
      } else if (error.message.includes('HTTP error')) {
        const statusMatch = error.message.match(/status: (\d+)/);
        const status = statusMatch ? statusMatch[1] : 'desconhecido';
        errorMessage = `Erro HTTP ${status}: Problema no servidor de homologação`;
        technicalError = `HTTP ${status} - ${error.message}`;
      } else if (error.message.includes('fetch')) {
        errorMessage = "Erro de rede: Verifique sua conexão";
        technicalError = "Erro de conectividade - " + error.message;
      }
      
      setLastError(technicalError);
      setIsOpen(true); // Auto-expand debug section on error
      
      // Store error debug information
      setApiDebugInfo({
        request: {
          url: tipo_simulacao !== "OFFLINE" ? 'https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/comando' : 'offline',
          method: 'POST',
          body: { comando: 'RLIINFO', cpf },
          timestamp: new Date().toISOString()
        },
        error: {
          message: technicalError,
          originalError: error.message,
          stack: error.stack
        },
        performance: {
          responseTime: `${responseTime}ms`,
          status: 'error'
        }
      });
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleRetry = () => {
    setLastError(null);
    setApiDebugInfo(null);
    handleSubmit();
  };

  const formatCPF = (value: string) => {
    if (!value) return "";
    
    value = value.replace(/\D/g, "");
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
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
              >
                ←
              </Button>
            );
          } else if (key === "ENTER") {
            return (
              <Button
                key={key}
                className="h-16 bg-dotz-laranja hover:bg-dotz-laranja/90 text-white"
                disabled={cpf.length !== 11 || isLoading}
                onClick={handleSubmit}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Processando</span>
                  </div>
                ) : "ENTRA"}
              </Button>
            );
          } else {
            return (
              <Button
                key={key}
                variant="outline"
                className="h-16 text-xl font-medium bg-white hover:bg-gray-100"
                onClick={() => handleKeyPress(key)}
                disabled={isLoading}
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
    <div className="min-h-screen bg-gray-100 relative">
      {/* Test Users Sidebar */}
      <TestUsersSidebar onCpfSelect={handleCpfSelect} />

      {/* User Profile Button - fixed position at top of page */}
      <div className="fixed top-4 left-6 z-50">
        <UserProfileButton 
          userName={sessionLoading ? "Carregando..." : userName}
          companyName={sessionLoading ? "Carregando..." : companyName}
        />
      </div>

      {/* Main content with left margin to account for sidebar */}
      <div className="ml-80">
        <PdvLayout className="flex flex-col items-center justify-center pb-16">
          <Card className="w-full max-w-md p-6 flex flex-col items-center relative">
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-dotz-laranja mb-2" />
                <p className="text-sm font-medium text-gray-600">{loadingMessage}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>Aguarde...</span>
                </div>
              </div>
            )}
            
            <div className="w-full mb-8">
              <h2 className="text-2xl font-bold text-center mb-6">Informe seu CPF</h2>
              
              {/* Alert for non-OFFLINE simulation types */}
              {tipo_simulacao && tipo_simulacao !== "OFFLINE" && (
                <Alert className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Atenção este parceiro está parametrizado para que as requisições de simulação seja feito em ambiente de homologação da Dotz
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Error Alert with Retry */}
              {lastError && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="mb-2">{lastError}</div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetry}
                      className="bg-white hover:bg-red-50 border-red-200"
                    >
                      Tentar novamente
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="relative mb-6">
                <Input
                  className="text-center text-xl h-14 pr-14"
                  value={formatCPF(cpf)}
                  readOnly
                  placeholder="Digite seu CPF"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 hover:bg-gray-100"
                  onClick={handleGenerateCPF}
                  disabled={isLoading}
                  title="Gerar CPF válido"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
              <NumPad />
            </div>
          </Card>

        </PdvLayout>
      </div>
      
      {/* Technical Footer Component */}
      <TechnicalFooter
        requestData={apiDebugInfo ? JSON.stringify(apiDebugInfo, null, 2) : undefined}
        responseData={apiDebugInfo?.response ? JSON.stringify(apiDebugInfo.response, null, 2) : undefined}
        isLoading={isLoading}
        slug="RLIINFO"
        loadOnMount={!!apiDebugInfo}
        sourceScreen="cpf"
      />
    </div>
  );
};

export default CpfScreen;
