
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TechnicalDocumentationProps {
  requestData?: string | null;
  responseData?: string | null;
  isLoading: boolean;
  slug?: string;
}

const TechnicalDocumentation = ({
  requestData,
  responseData,
  isLoading,
  slug
}: TechnicalDocumentationProps) => {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [serviceNames, setServiceNames] = useState({
    nome_request_servico: "",
    nome_response_servico: ""
  });

  // Format text with proper line breaks and spacing
  const formatText = (text: string | null | undefined) => {
    if (!text) return "";

    // Replace escaped newlines and tabs with actual line breaks and spaces
    return text.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
  };

  // Fetch service names if not provided directly
  useEffect(() => {
    const fetchServiceNames = async () => {
      // Only fetch if we have a slug
      if (!slug) return;
      
      try {
        const url = `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/consultaFluxoDetalhe?SLUG=${slug}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error fetching service details: ${response.status}`);
        }
        
        const data = await response.json();
        
        setServiceNames({
          nome_request_servico: data.nome_request_servico || "Desconhecido",
          nome_response_servico: data.nome_response_servico || "Desconhecido"
        });
        
        console.log("Service names fetched:", data);
      } catch (error) {
        console.error("Error fetching service names:", error);
        setServiceNames({
          nome_request_servico: "Desconhecido",
          nome_response_servico: "Desconhecido"
        });
      }
    };
    
    fetchServiceNames();
  }, [slug]);

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
                {formatText(requestData)}
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
                {formatText(responseData)}
              </pre>}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default TechnicalDocumentation;
