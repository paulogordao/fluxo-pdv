
import { Button } from "@/components/ui/button";
import PdvLayout from "@/components/PdvLayout";
import UserProfileButton from "@/components/UserProfileButton";
import { useUserSession } from "@/hooks/useUserSession";
import { ArrowRight, Barcode } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { userName, companyName, isLoading } = useUserSession();
  
  const handleStart = () => {
    // Simular início de sessão antes de navegar
    console.log('API Call: POST /api/sessions/start - Iniciando nova sessão de atendimento');
    navigate('/start');
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* User Profile Button - positioned in top left with larger size */}
      <div className="absolute top-6 left-6 z-10">
        <UserProfileButton 
          userName={isLoading ? "Carregando..." : userName}
          companyName={isLoading ? "Carregando..." : companyName}
        />
      </div>

      <PdvLayout 
        className="flex flex-col items-center justify-center text-center"
        apiCall={{
          endpoint: "/api/sessions/start",
          method: "POST",
          description: "Este endpoint deve ser chamado ao iniciar uma nova sessão de atendimento."
        }}
      >
        <div className="space-y-8 flex flex-col items-center">
          <div className="p-6 bg-dotz-offwhite rounded-full">
            <Barcode className="w-24 h-24 text-dotz-laranja" strokeWidth={1.5} />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Escanei seus produtos para iniciar</h1>
            <p className="text-gray-500 text-lg">
              ou toque no botão abaixo
            </p>
          </div>
          
          <Button 
            onClick={handleStart} 
            size="lg" 
            className="mt-8 px-6 py-6 text-lg bg-dotz-laranja hover:bg-dotz-laranja/90 text-white"
          >
            INICIAR COMPRA <ArrowRight className="ml-2" />
          </Button>
          
          <div className="mt-12 text-sm text-gray-400 border-t border-gray-200 pt-6 w-full">
            <p>
              Dev Notes: Ao clicar no botão, uma nova sessão é iniciada usando a API fornecida.
            </p>
          </div>
        </div>
      </PdvLayout>
    </div>
  );
};

export default WelcomeScreen;
