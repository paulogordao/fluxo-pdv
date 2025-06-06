import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PdvLayout from "@/components/PdvLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import TechnicalDocumentation from "@/components/technical/TechnicalDocumentation";
import { consultaFluxoService } from "@/services/consultaFluxoService";

const TelefoneScreen = () => {
  const [telefone, setTelefone] = useState("");
  const [apiData, setApiData] = useState<{
    request_servico?: any;
    response_servico_anterior?: any;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
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

  const handleSubmit = () => {
    console.log(`Celular informado: ${formatTelefone(telefone)}`);
    // Updated to redirect to the transition screen with query parameter
    navigate("/transicao-cadastro?from=telefone");
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
              >
                ←
              </Button>
            );
          } else if (key === "ENTER") {
            return (
              <Button
                key={key}
                className="h-16 bg-dotz-laranja hover:bg-dotz-laranja/90 text-white"
                disabled={telefone.length < 10}
                onClick={handleSubmit}
              >
                ENTRA
              </Button>
            );
          } else {
            return (
              <Button
                key={key}
                variant="outline"
                className="h-16 text-xl font-medium bg-white hover:bg-gray-100"
                onClick={() => handleKeyPress(key)}
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
      <Card className="w-full max-w-md p-6 flex flex-col items-center">
        <div className="w-full mb-8">
          <h2 className="text-2xl font-bold text-center mb-6">Informe seu Celular</h2>
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
            >
              Não Informar
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-8 w-full max-w-3xl">
        {/* Technical documentation */}
        <TechnicalDocumentation
          requestData={apiData.request_servico}
          responseData={apiData.response_servico_anterior}
          isLoading={isLoading}
          slug="RLIINFORLICELL"
        />
      </div>
    </PdvLayout>
  );
};

export default TelefoneScreen;
