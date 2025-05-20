
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PdvLayout from "@/components/PdvLayout";
import { Card } from "@/components/ui/card";
import { Loader } from "lucide-react";

const TransicaoCadastroScreen = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/scan");
    }, 5000);
    
    // Countdown effect
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [navigate]);

  return (
    <PdvLayout className="flex flex-col items-center justify-center">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="py-6">
          <h2 className="text-3xl font-bold mb-4">Obrigado!</h2>
          <p className="text-gray-600 mb-8">
            Enviaremos em breve uma mensagem para completar o cadastro!
          </p>
          
          <div className="flex justify-center items-center space-x-3">
            <Loader className="animate-spin text-dotz-laranja" />
            <span className="text-gray-500">Redirecionando em {countdown}s...</span>
          </div>
        </div>
      </Card>
    </PdvLayout>
  );
};

export default TransicaoCadastroScreen;
