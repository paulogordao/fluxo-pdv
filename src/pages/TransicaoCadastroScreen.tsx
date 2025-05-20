
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PdvLayout from "@/components/PdvLayout";
import { LoaderCircle } from "lucide-react";

const TransicaoCadastroScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract the 'from' parameter from the URL
  const from = new URLSearchParams(location.search).get('from') || 'cpf';

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Simulate API calls in the background
    const simulateApiCall = async () => {
      try {
        console.log('Vinculando telefone ao CPF do cliente...');
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Telefone vinculado com sucesso!');
      } catch (error) {
        console.error('Erro ao vincular telefone:', error);
      }
    };
    
    simulateApiCall();

    // Set up countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Forward the 'from' parameter when navigating to scan
          navigate(`/scan?from=${from}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, from]);

  return (
    <PdvLayout className="flex flex-col items-center justify-center">
      <div className="text-center space-y-8">
        <LoaderCircle className="animate-spin h-16 w-16 mx-auto text-dotz-laranja" />
        
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Cadastrando dados do cliente</h1>
          <p className="text-lg">Aguarde, estamos processando seus dados...</p>
          <p className="text-dotz-laranja font-medium">
            Você será redirecionado em {countdown} segundos
          </p>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded p-4 max-w-md mx-auto">
          <p className="text-sm text-gray-500">
            Estamos associando seu telefone ao seu CPF para oferecer uma experiência personalizada.
          </p>
        </div>
      </div>
    </PdvLayout>
  );
};

export default TransicaoCadastroScreen;
