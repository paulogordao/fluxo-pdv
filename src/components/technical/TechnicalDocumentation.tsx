
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TechnicalDocumentationProps {
  requestData?: string | null;
  responseData?: string | null;
  isLoading?: boolean;
  slug?: string;
  loadOnMount?: boolean;
}

const TechnicalDocumentation = ({
  requestData: initialRequestData,
  responseData: initialResponseData,
  isLoading: initialIsLoading,
  slug,
  loadOnMount = true
}: TechnicalDocumentationProps) => {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [serviceNames, setServiceNames] = useState({
    nome_request_servico: "",
    nome_response_servico: ""
  });
  const [isLoading, setIsLoading] = useState(initialIsLoading || false);
  const [apiData, setApiData] = useState({
    request_servico: initialRequestData || "",
    response_servico_anterior: initialResponseData || ""
  });
  
  // Format text with proper line breaks and spacing
  const formatText = (text: string | null | undefined) => {
    if (!text) return "";

    // Replace escaped newlines and tabs with actual line breaks and spaces
    return text.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
  };

  // Fetch data when slug is provided or changed
  useEffect(() => {
    // Skip if no slug
    if (!slug) return;
    
    const fetchServiceDetails = async () => {
      setIsLoading(true);
      try {
        const url = `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/consultaFluxoDetalhe?SLUG=${slug}`;
        console.log("Fetching technical documentation for:", url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error fetching service details: ${response.status}`);
        }
        
        const data = await response.json();
        
        setServiceNames({
          nome_request_servico: data.nome_request_servico || "Desconhecido",
          nome_response_servico: data.nome_response_servico || "Desconhecido"
        });
        
        setApiData({
          request_servico: data.request_servico || "",
          response_servico_anterior: data.response_servico_anterior || ""
        });
        
        console.log("Technical documentation data fetched:", data);
      } catch (error) {
        console.error("Error fetching service details:", error);
        setServiceNames({
          nome_request_servico: "Desconhecido",
          nome_response_servico: "Desconhecido"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Always fetch data if loadOnMount is true
    if (loadOnMount) {
      fetchServiceDetails();
    }
  }, [slug, loadOnMount]);

  return (
    <div className="mt-8 space-y-4">
      {/* Request Collapsible */}
      <Collapsible open={isRequestOpen} onOpenChange={setIsRequestOpen} className="border border-gray-200 rounded-md shadow overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-white px-4 py-3 font-medium text-left">
          <span>🔻 Request do serviço atual ({serviceNames.nome_request_servico})</span>
          {isRequestOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 bg-white">
            {isLoading ? <div className="p-4 text-center">Carregando...</div> : <pre className="text-sm font-mono bg-gray-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">
                {formatText(apiData.request_servico)}
              </pre>}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Response Collapsible */}
      <Collapsible open={isResponseOpen} onOpenChange={setIsResponseOpen} className="border border-gray-200 rounded-md shadow overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-white px-4 py-3 font-medium text-left">
          <span>🔻 Response do serviço anterior ({serviceNames.nome_response_servico})</span>
          {isResponseOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 bg-white">
            {isLoading ? <div className="p-4 text-center">Carregando...</div> : <pre className="text-sm font-mono bg-gray-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">
                {formatText(apiData.response_servico_anterior)}
              </pre>}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default TechnicalDocumentation;
