
import { Button } from "@/components/ui/button";
import PdvLayout from "@/components/PdvLayout";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WelcomeScreen = () => {
  const navigate = useNavigate();
  
  const handleStart = () => {
    // Simular início de sessão antes de navegar
    console.log('API Call: POST /api/sessions/start - Iniciando nova sessão de atendimento');
    navigate('/start');
  };

  return (
    <PdvLayout 
      className="flex flex-col items-center justify-center text-center"
      apiCall={{
        endpoint: "/api/sessions/start",
        method: "POST",
        description: "Este endpoint deve ser chamado ao iniciar uma nova sessão de atendimento."
      }}
    >
      <div className="space-y-8 flex flex-col items-center">
        <div className="p-6 bg-blue-50 rounded-full">
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
              d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" 
            />
          </svg>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Bem-vindo ao Self-Checkout</h1>
          <p className="text-gray-500 text-lg">
            Toque na tela para começar
          </p>
        </div>
        
        <Button 
          onClick={handleStart} 
          size="lg" 
          className="mt-8 px-6 py-6 text-lg bg-blue-600 hover:bg-blue-700"
        >
          Iniciar Atendimento <ArrowRight className="ml-2" />
        </Button>
        
        <div className="mt-12 text-sm text-gray-400 border-t border-gray-200 pt-6 w-full">
          <p>
            Dev Notes: Ao clicar no botão, uma nova sessão é iniciada usando a API fornecida.
          </p>
        </div>
      </div>
    </PdvLayout>
  );
};

export default WelcomeScreen;
