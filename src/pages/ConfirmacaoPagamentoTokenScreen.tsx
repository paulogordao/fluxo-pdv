
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TechnicalFooter from "@/components/TechnicalFooter";
import { useUserSession } from "@/hooks/useUserSession";
import { comandoService } from "@/services/comandoService";
import { toast } from "sonner";

const ConfirmacaoPagamentoTokenScreen = () => {
  const [tokenDigits, setTokenDigits] = useState<string[]>([]);
  const [remainingTime, setRemainingTime] = useState(16); // Initial time in seconds
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const { tipo_simulacao, isLoading: sessionLoading } = useUserSession();
  
  // Debug log to see the actual value
  console.log('[TokenScreen] tipo_simulacao:', tipo_simulacao);
  
  // Determine if this is an ONLINE company (UAT or any non-OFFLINE company)
  const isOnlineCompany = tipo_simulacao && !tipo_simulacao.includes('OFFLINE');
  
  console.log('[TokenScreen] isOnlineCompany:', isOnlineCompany);
  
  // Mock token for the app emulator
  const mockToken = "128456";

  // Simulated timer for token expiration
  useEffect(() => {
    if (remainingTime <= 0) return;
    
    const timer = setTimeout(() => {
      setRemainingTime(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [remainingTime]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // Handle number input
  const handleNumberClick = (num: string) => {
    if (tokenDigits.length < 6) {
      setTokenDigits((prev) => [...prev, num]);
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    if (tokenDigits.length > 0) {
      setTokenDigits((prev) => prev.slice(0, -1));
    }
  };

  // Handle enter button
  const handleEnter = async () => {
    if (tokenDigits.length === 6) {
      const token = tokenDigits.join('');
      
      // For ONLINE companies, make RLIAUTH call
      if (isOnlineCompany) {
        setIsLoading(true);
        
        try {
          // Get transaction ID from localStorage
          const transactionId = localStorage.getItem('transactionId');
          if (!transactionId) {
            toast.error("Erro: ID da transação não encontrado");
            setIsLoading(false);
            return;
          }
          
          console.log('[TokenScreen] Calling RLIAUTH with token:', token);
          const response = await comandoService.enviarComandoRliauth(transactionId, token);
          console.log('[TokenScreen] RLIAUTH Response:', response);
          
          // Store the RLIAUTH response in localStorage
          localStorage.setItem('rliauthResponse', JSON.stringify(response));
          
          // Navigate to confirmation page
          navigate("/confirmacao_pagamento", { 
            state: { fromTokenScreen: true, isOnline: true } 
          });
          
        } catch (error) {
          console.error('[TokenScreen] Error calling RLIAUTH:', error);
          toast.error("Erro ao validar token. Tente novamente.");
        } finally {
          setIsLoading(false);
        }
      } else {
        // For OFFLINE companies, keep current behavior
        navigate("/confirmacao_pagamento", { 
          state: { fromTokenScreen: true, isOnline: false } 
        });
      }
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigate("/meios_de_pagamento");
  };

  // Check if enter button should be enabled
  const isEnterEnabled = tokenDigits.length === 6;

  // Get client name from localStorage (fallback to empty string if not available)
  const clientName = localStorage.getItem('nomeCliente') || 'Cliente';

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-16">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Panel - PDV Token Input */}
        <Card className="w-full shadow-lg overflow-hidden">
          <CardHeader className="bg-dotz-laranja text-white">
            <CardTitle className="text-center">
              Pagamento Cliente A
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-4">
                Aguardando pagamento com Token no APP Cliente A
              </h3>
              
              {/* Display the entered token digits */}
              <div className="flex justify-center gap-2 mb-6">
                {Array(6).fill(0).map((_, index) => (
                  <div 
                    key={index}
                    className={`w-10 h-12 border-2 ${
                      index < tokenDigits.length 
                        ? "border-dotz-laranja bg-orange-50" 
                        : "border-gray-300"
                    } rounded flex items-center justify-center text-xl font-bold`}
                  >
                    {index < tokenDigits.length ? tokenDigits[index] : ""}
                  </div>
                ))}
              </div>
              
              {/* Numeric keypad */}
              <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                {/* Row 1: 1, 2, 3 */}
                {[1, 2, 3].map((num) => (
                  <Button 
                    key={num}
                    variant="outline" 
                    onClick={() => handleNumberClick(num.toString())} 
                    className="h-14 text-xl shadow-sm"
                  >
                    {num}
                  </Button>
                ))}
                
                {/* Row 2: 4, 5, 6 */}
                {[4, 5, 6].map((num) => (
                  <Button 
                    key={num}
                    variant="outline" 
                    onClick={() => handleNumberClick(num.toString())} 
                    className="h-14 text-xl shadow-sm"
                  >
                    {num}
                  </Button>
                ))}
                
                {/* Row 3: 7, 8, 9 */}
                {[7, 8, 9].map((num) => (
                  <Button 
                    key={num}
                    variant="outline" 
                    onClick={() => handleNumberClick(num.toString())} 
                    className="h-14 text-xl shadow-sm"
                  >
                    {num}
                  </Button>
                ))}
                
                {/* Row 4: Backspace, 0, Enter */}
                <Button 
                  variant="outline" 
                  onClick={handleBackspace} 
                  className="h-14 text-xl shadow-sm"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleNumberClick("0")} 
                  className="h-14 text-xl shadow-sm"
                >
                  0
                </Button>
                <Button 
                  variant={isEnterEnabled ? "dotz" : "outline"} 
                  onClick={handleEnter} 
                  disabled={!isEnterEnabled || isLoading} 
                  className="h-14 text-sm font-bold shadow-sm"
                >
                  {isLoading ? "Validando..." : "ENTRAR"}
                </Button>
              </div>

              {/* Cancel button */}
              <div className="mt-8">
                <Button 
                  variant="cancel"
                  className="w-full sm:w-auto"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Instructions for ONLINE or App Emulator for OFFLINE */}
        {isOnlineCompany ? (
          /* Instructions Card for ONLINE companies */
          <Card className="w-full shadow-lg">
            <CardHeader className="bg-blue-600 text-white">
              <CardTitle className="text-center">
                Instruções para Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="text-6xl mb-4">📱</div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Para gerar o token:
                  </h3>
                  <div className="space-y-3 text-left bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                      <p className="text-gray-700">Abra o aplicativo da empresa no seu celular</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                      <p className="text-gray-700">Acesse a opção de pagamento</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                      <p className="text-gray-700">Gere um token de 6 dígitos</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">4</div>
                      <p className="text-gray-700">Digite o token no campo ao lado</p>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                    <p className="text-yellow-800 text-sm">
                      <strong>Importante:</strong> O token tem validade limitada. Gere um novo token se este expirar.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* App Token Emulator for OFFLINE companies */
          <div className="flex justify-center">
            <div className="bg-white rounded-3xl border-2 border-gray-300 shadow-xl overflow-hidden max-w-xs w-full">
              <div className="aspect-w-9 aspect-h-16">
                <div className="p-4">
                  {/* App Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ArrowLeft className="h-4 w-4 text-gray-700 mr-2" />
                      <h3 className="text-sm font-medium">Wallet by <span className="font-bold">d<span className="text-dotz-laranja">o</span>tz</span></h3>
                    </div>
                    <button className="text-gray-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* User Info */}
                  <div className="mt-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" alt="Avatar" />
                        <AvatarFallback>{clientName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Olá, {clientName}</p>
                        <button className="flex items-center gap-1 text-xs text-gray-600">
                          <ArrowLeft className="h-3 w-3" /> Trocar conta
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Token Card */}
                  <div className="bg-white rounded-xl shadow-md p-5 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium">Token para pagamento</p>
                      <X className="h-4 w-4 text-gray-500" />
                    </div>
                    
                    {/* Loading Spinner (Just visual) */}
                    <div className="flex justify-center my-4">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                      </div>
                    </div>
                    
                    {/* Token Display */}
                    <div className="text-center mb-2">
                      <p className="text-3xl font-bold tracking-wider">
                        {mockToken.split("").join(" ")}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatTime(remainingTime)}
                      </p>
                    </div>
                    
                    <p className="text-center text-sm text-gray-600 mb-4">
                      Informe o código no caixa.
                    </p>
                    
                    {/* Close Button */}
                    <Button 
                      className="w-full border border-dotz-laranja text-dotz-laranja bg-white hover:bg-orange-50 rounded-full"
                    >
                      Fechar
                    </Button>
                  </div>

                  {/* App Content Visual Representation */}
                  <div className="mt-10 pt-6 border-t border-gray-200">
                    <div className="bg-orange-50 rounded-lg p-3 flex items-start">
                      <div className="bg-dotz-laranja text-white rounded-full h-5 w-5 flex items-center justify-center mr-2 text-xs">
                        <span>●</span>
                      </div>
                      <p className="text-xs">
                        Token válido por 5 minutos. Após esse período, gere um novo token.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Technical Footer Component */}
      <TechnicalFooter
        slug="RLIDEALRLIAUTH"
        loadOnMount={true}
        sourceScreen="confirmacao_pagamento_token"
      />
    </div>
  );
};

export default ConfirmacaoPagamentoTokenScreen;
