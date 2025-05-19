
import PdvLayout from "@/components/PdvLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useState } from "react";

const StartScreen = () => {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(true);

  const handleContinue = () => {
    // Simular preparação de sessão para leitura de produtos
    console.log('API Call: POST /api/sessions/customer/identify - Sessão pronta para leitura de produtos');
    console.log('Cliente optou por não participar do programa de fidelidade');
    navigate('/scan');
  };

  const handleYes = () => {
    console.log('Cliente optou por participar do programa de fidelidade');
    navigate('/cpf');
  };

  const handleNo = () => {
    setShowDialog(false);
    console.log('Cliente optou por não participar do programa de fidelidade');
  };

  return (
    <PdvLayout 
      className="flex flex-col items-center justify-center text-center"
      apiCall={{
        endpoint: "/api/sessions/customer/identify",
        method: "POST",
        description: "Este endpoint identifica o cliente (opcional) e prepara a sessão para leitura de produtos."
      }}
    >
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center mb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-red-600 rounded-full p-3">
                  <span className="text-white text-xl font-bold">A+</span>
                </div>
              </div>
              <span className="text-xl">Deseja participar do<br />Cliente A + Dotz?</span>
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleNo}
              className="w-28 bg-gray-200 hover:bg-gray-300 text-gray-800 border-none"
            >
              Não
            </Button>
            <Button 
              onClick={handleYes}
              className="w-28 bg-red-600 hover:bg-red-700 text-white"
            >
              Sim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-8 flex flex-col items-center">
        <div className="mb-4 p-6 bg-blue-50 rounded-full">
          <svg 
            className="w-24 h-24 text-blue-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold">Por favor, escolha uma opção:</h1>
        
        <div className="grid grid-cols-1 gap-6 w-full max-w-lg">
          <Button
            variant="outline"
            size="lg"
            className="h-24 text-lg flex flex-col gap-2 border-2"
            onClick={handleContinue}
          >
            <span>Continuar sem identificação</span>
            <span className="text-sm text-gray-500">Checkout rápido sem benefícios</span>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="h-24 text-lg flex flex-col gap-2 border-2"
            onClick={handleContinue}
          >
            <span>Usar CPF na nota</span>
            <span className="text-sm text-gray-500">Identificação por CPF</span>
          </Button>
          
          <Button
            size="lg"
            className="h-24 text-lg bg-blue-600 hover:bg-blue-700"
            onClick={handleContinue}
          >
            <span>Continuar para produtos</span>
            <ArrowRight className="ml-2" />
          </Button>
        </div>
        
        <div className="mt-12 text-sm text-gray-400 border-t border-gray-200 pt-6 w-full">
          <p>
            Dev Notes: Esta tela demonstra a identificação opcional do cliente. 
            O endpoint deve ser chamado mesmo que o cliente opte por não se identificar.
          </p>
        </div>
      </div>
    </PdvLayout>
  );
};

export default StartScreen;
