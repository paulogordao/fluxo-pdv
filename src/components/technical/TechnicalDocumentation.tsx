import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { consultaFluxoService } from "@/services/consultaFluxoService";

interface TechnicalDocumentationProps {
  slug?: string;
  requestData?: string | null;
  responseData?: string | null;
  isLoading?: boolean;
  loadOnMount?: boolean;
  sourceScreen?: string;
}

interface ApiResponse {
  nome_request_servico: string;
  nome_response_servico: string;
  request_servico: string;
  response_servico_anterior: string;
}

const TechnicalDocumentation = ({
  slug,
  requestData: initialRequestData,
  responseData: initialResponseData,
  isLoading: externalIsLoading,
  loadOnMount = true,
  sourceScreen
}: TechnicalDocumentationProps) => {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(externalIsLoading ?? true);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Format text with proper line breaks and spacing
  const formatText = (text: string) => {
    // Replace escaped newlines and tabs with actual line breaks and spaces
    return text.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
  };

  // Copy to clipboard functionality
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado com sucesso`);
  };

  // Fetch technical documentation from the API
  useEffect(() => {
    // If external data is provided, use that instead of fetching
    if (initialRequestData || initialResponseData) {
      setApiData({
        nome_request_servico: "Serviço Atual",
        nome_response_servico: "Serviço Anterior",
        request_servico: initialRequestData || "",
        response_servico_anterior: initialResponseData || ""
      });
      setIsLoading(false);
      return;
    }

    // If not supposed to load on mount, exit early
    if (!loadOnMount) {
      setIsLoading(false);
      return;
    }
    
    const fetchDocumentation = async () => {
      if (!slug) {
        setError("Slug não fornecido");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        console.log("Fetching technical documentation for:", slug);
        const data = await consultaFluxoService.consultarFluxoDetalhe(slug);
        
        setApiData({
          nome_request_servico: data.nome_request_servico || "Desconhecido",
          nome_response_servico: data.nome_response_servico || "Desconhecido",
          request_servico: data.request_servico || "",
          response_servico_anterior: data.response_servico_anterior || ""
        });
        console.log("Technical documentation data fetched:", data);
      } catch (err) {
        console.error("Error fetching documentation:", err);
        setError("Documentação técnica indisponível no momento.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocumentation();
  }, [slug, initialRequestData, initialResponseData, loadOnMount]);
  if (isLoading) {
    return <div className="mt-8 text-center">Carregando documentação técnica...</div>;
  }
  if (error) {
    return <div className="mt-8 text-center text-red-500">{error}</div>;
  }
  if (!apiData) {
    if (!loadOnMount) {
      return <div className="mt-8 text-center text-gray-600">Faça uma requisição para visualizar os dados técnicos.</div>;
    }
    return <div className="mt-8 text-center">Documentação técnica indisponível no momento.</div>;
  }
  return <div className="mt-8 space-y-4">
      {/* Optional source indicator */}
      {sourceScreen}
      
      {/* Request Collapsible */}
      <Collapsible open={isRequestOpen} onOpenChange={setIsRequestOpen} className="border border-gray-200 rounded-md shadow overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-white px-4 py-3 font-medium text-left">
          <div className="flex items-center gap-2">
            <span>🔻 Request do serviço atual ({apiData.nome_request_servico})</span>
          </div>
          {isRequestOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 bg-white">
            <div className="flex justify-end mb-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs" onClick={() => handleCopy(apiData.request_servico, "Request")} title="Copiar para área de transferência">
                <Copy className="h-3 w-3" />
                Copiar JSON
              </Button>
            </div>
            <pre className="text-sm font-mono bg-gray-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">
              {formatText(apiData.request_servico)}
            </pre>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Response Collapsible */}
      <Collapsible open={isResponseOpen} onOpenChange={setIsResponseOpen} className="border border-gray-200 rounded-md shadow overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-white px-4 py-3 font-medium text-left">
          <div className="flex items-center gap-2">
            <span>🔻 Response do serviço anterior ({apiData.nome_response_servico})</span>
          </div>
          {isResponseOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 bg-white">
            <div className="flex justify-end mb-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs" onClick={() => handleCopy(apiData.response_servico_anterior, "Response")} title="Copiar para área de transferência">
                <Copy className="h-3 w-3" />
                Copiar JSON
              </Button>
            </div>
            <pre className="text-sm font-mono bg-gray-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">
              {formatText(apiData.response_servico_anterior)}
            </pre>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>;
};

export default TechnicalDocumentation;
