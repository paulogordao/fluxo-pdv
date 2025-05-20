
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import PdvLayout from "@/components/PdvLayout";
import { toast } from "@/components/ui/sonner";

const MeiosDePagamentoScreen = () => {
  const [selectedOption, setSelectedOption] = useState("app");
  const navigate = useNavigate();
  
  // API integration states
  const [apiData, setApiData] = useState<{
    request_servico?: string;
    response_servico_anterior?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);

  // Fetch API data with fixed SLUG
  useEffect(() => {
    const fetchApiData = async () => {
      try {
        // Get stored CPF from localStorage (still needed for logging/context)
        const cpf = localStorage.getItem('cpfDigitado');
        
        // Fallback if CPF is not available
        if (!cpf) {
          console.error('CPF não encontrado. Redirecionando para a etapa de identificação.');
          toast.error("CPF não encontrado");
          navigate('/cpf');
          return;
        }
        
        // Use the fixed SLUG directly
        const fixedSlug = "RLIFUNDRLIDEAL";
        const url = `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/consultaFluxoDetalhe?SLUG=${fixedSlug}`;
        console.log("Fetching API details:", url);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error in request: ${response.status}`);
        }
        
        const data = await response.json();
        setApiData(data);
        console.log("API data:", data);
      } catch (error) {
        console.error("Error fetching API data:", error);
        toast.error("Erro ao carregar detalhes");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApiData();
  }, [navigate]);

  // Format text with proper line breaks and spacing
  const formatText = (text: string | null | undefined) => {
    if (!text) return "";
    
    // Replace escaped newlines and tabs with actual line breaks and spaces
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '  ');
  };

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  return (
    <PdvLayout>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="bg-dotz-laranja text-white">
          <CardTitle className="text-center">
            Benefícios cliente A
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-4">
              Manoel, você quer pagar com seus pontos?
            </h3>
            
            <div className="space-y-3 mt-6">
              {/* App option */}
              <Button 
                onClick={() => handleOptionSelect("app")}
                variant={selectedOption === "app" ? "default" : "outline"}
                className={`w-full py-6 text-base font-medium ${
                  selectedOption === "app" 
                    ? "bg-dotz-laranja hover:bg-dotz-laranja/90 text-white" 
                    : "bg-gray-300 hover:bg-gray-400 text-black"
                }`}
              >
                1. Até R$68,93 no APP
              </Button>
              
              {/* Livelo option */}
              <Button 
                onClick={() => handleOptionSelect("livelo")}
                variant={selectedOption === "livelo" ? "default" : "outline"}
                className={`w-full py-6 text-base font-medium ${
                  selectedOption === "livelo" 
                    ? "bg-dotz-laranja hover:bg-dotz-laranja/90 text-white" 
                    : "bg-gray-300 hover:bg-gray-400 text-black"
                }`}
              >
                2. R$60 (Livelo) sem APP
              </Button>
              
              {/* Dotz option */}
              <Button 
                onClick={() => handleOptionSelect("dotz")}
                variant={selectedOption === "dotz" ? "default" : "outline"}
                className={`w-full py-6 text-base font-medium ${
                  selectedOption === "dotz" 
                    ? "bg-dotz-laranja hover:bg-dotz-laranja/90 text-white" 
                    : "bg-gray-300 hover:bg-gray-400 text-black"
                }`}
              >
                3. R$3 (Dotz) sem APP
              </Button>
              
              {/* None option */}
              <Button 
                onClick={() => handleOptionSelect("none")}
                variant={selectedOption === "none" ? "default" : "outline"}
                className={`w-full py-6 text-base font-medium ${
                  selectedOption === "none" 
                    ? "bg-dotz-laranja hover:bg-dotz-laranja/90 text-white" 
                    : "bg-gray-300 hover:bg-gray-400 text-black"
                }`}
              >
                4. Nenhum
              </Button>
            </div>
          </div>
          
          {/* Technical documentation section */}
          <div className="mt-8 space-y-4">
            {/* Request Collapsible */}
            <Collapsible
              open={isRequestOpen}
              onOpenChange={setIsRequestOpen}
              className="border border-gray-200 rounded-md shadow overflow-hidden"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full bg-white px-4 py-3 font-medium text-left">
                <span>🔻 Request do serviço atual (RLIDEAL)</span>
                {isRequestOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 bg-white">
                  {isLoading ? (
                    <div className="p-4 text-center">Carregando...</div>
                  ) : (
                    <pre className="text-sm font-mono bg-gray-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">
                      {formatText(apiData.request_servico)}
                    </pre>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Response Collapsible */}
            <Collapsible
              open={isResponseOpen}
              onOpenChange={setIsResponseOpen}
              className="border border-gray-200 rounded-md shadow overflow-hidden"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full bg-white px-4 py-3 font-medium text-left">
                <span>🔻 Response do serviço anterior (RLFUND)</span>
                {isResponseOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 bg-white">
                  {isLoading ? (
                    <div className="p-4 text-center">Carregando...</div>
                  ) : (
                    <pre className="text-sm font-mono bg-gray-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">
                      {formatText(apiData.response_servico_anterior)}
                    </pre>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>
    </PdvLayout>
  );
};

export default MeiosDePagamentoScreen;
