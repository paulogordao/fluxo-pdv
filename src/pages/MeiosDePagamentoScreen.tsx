
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ScanScreen from "./ScanScreen";

const MeiosDePagamentoScreen = () => {
  const [open, setOpen] = useState(true);
  const [selectedOption, setSelectedOption] = useState("app");
  const navigate = useNavigate();
  
  // API integration states
  const [apiSlug, setApiSlug] = useState<string | null>(null);
  const [apiData, setApiData] = useState<{
    request_servico?: string;
    response_servico_anterior?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);

  // Handle dialog close
  const handleClose = () => {
    setOpen(false);
    navigate("/scan");
  };

  // Fetch initial slug with stored CPF
  useEffect(() => {
    const fetchSlug = async () => {
      try {
        // Get stored CPF from localStorage
        const cpf = localStorage.getItem('cpfDigitado');
        
        // Fallback if CPF is not available
        if (!cpf) {
          console.error('CPF não encontrado. Redirecionando para a etapa de identificação.');
          navigate('/cpf');
          return;
        }
        
        const url = `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/consultaFluxo?cpf=${cpf}&SLUG=RLFUND`;
        console.log("Fetching payment options data:", url);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error in request: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.SLUG) {
          setApiSlug(data.SLUG);
          console.log("API Slug fetched:", data.SLUG);
        } else {
          console.error("No SLUG in response:", data);
        }
      } catch (error) {
        console.error("Error fetching slug:", error);
      }
    };
    
    fetchSlug();
  }, [navigate]);
  
  // Fetch API data with the slug
  useEffect(() => {
    if (!apiSlug) return;
    
    const fetchApiData = async () => {
      try {
        const url = `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/consultaFluxoDetalhe?SLUG=${apiSlug}`;
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
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApiData();
  }, [apiSlug]);

  // Format text with proper line breaks and spacing
  const formatText = (text: string | null | undefined) => {
    if (!text) return "";
    
    // Replace escaped newlines and tabs with actual line breaks and spaces
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '  ');
  };

  return (
    <>
      {/* Display the ScanScreen component as background */}
      <div className="pointer-events-none opacity-70">
        <ScanScreen />
      </div>

      {/* Payment options dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white bg-dotz-laranja p-4 -m-6 mb-4 text-center">
              Benefícios cliente A
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 text-center">
            <h3 className="text-xl font-semibold mb-4">
              Manoel, você quer pagar com seus pontos?
            </h3>
            
            <RadioGroup 
              value={selectedOption} 
              onValueChange={setSelectedOption}
              className="space-y-3 mt-5"
            >
              <div className={`border rounded-md p-3 flex items-center space-x-2 ${selectedOption === "app" ? "bg-dotz-laranja text-white" : "bg-gray-300 hover:bg-gray-400"}`}>
                <RadioGroupItem value="app" id="app" className="hidden" />
                <Label htmlFor="app" className="flex-1 cursor-pointer font-medium">
                  1. Até R$68,93 no APP
                </Label>
              </div>
              
              <div className={`border rounded-md p-3 flex items-center space-x-2 ${selectedOption === "livelo" ? "bg-dotz-laranja text-white" : "bg-gray-300 hover:bg-gray-400"}`}>
                <RadioGroupItem value="livelo" id="livelo" className="hidden" />
                <Label htmlFor="livelo" className="flex-1 cursor-pointer font-medium">
                  2. R$60 (Livelo) sem APP
                </Label>
              </div>
              
              <div className={`border rounded-md p-3 flex items-center space-x-2 ${selectedOption === "dotz" ? "bg-dotz-laranja text-white" : "bg-gray-300 hover:bg-gray-400"}`}>
                <RadioGroupItem value="dotz" id="dotz" className="hidden" />
                <Label htmlFor="dotz" className="flex-1 cursor-pointer font-medium">
                  3. R$3 (Dotz) sem APP
                </Label>
              </div>
              
              <div className={`border rounded-md p-3 flex items-center space-x-2 ${selectedOption === "none" ? "bg-dotz-laranja text-white" : "bg-gray-300 hover:bg-gray-400"}`}>
                <RadioGroupItem value="none" id="none" className="hidden" />
                <Label htmlFor="none" className="flex-1 cursor-pointer font-medium">
                  4. Nenhum
                </Label>
              </div>
            </RadioGroup>
            
            <div className="mt-6">
              <Button
                className="min-w-[120px] bg-dotz-laranja hover:bg-dotz-laranja/90"
                onClick={handleClose}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Technical documentation */}
      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg overflow-hidden z-40">
        <div className="p-4 space-y-4">
          {/* Request Collapsible */}
          <Collapsible
            open={isRequestOpen}
            onOpenChange={setIsRequestOpen}
            className="border border-gray-200 rounded-md shadow overflow-hidden"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full bg-white px-4 py-3 font-medium text-left">
              <span>🔻 Request do serviço atual (RLFUND)</span>
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
              <span>🔻 Response do serviço anterior (RLIFUND)</span>
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
      </div>
    </>
  );
};

export default MeiosDePagamentoScreen;
