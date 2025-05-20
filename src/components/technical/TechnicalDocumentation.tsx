import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
interface TechnicalDocumentationProps {
  requestData?: string | null;
  responseData?: string | null;
  isLoading: boolean;
}
const TechnicalDocumentation = ({
  requestData,
  responseData,
  isLoading
}: TechnicalDocumentationProps) => {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);

  // Format text with proper line breaks and spacing
  const formatText = (text: string | null | undefined) => {
    if (!text) return "";

    // Replace escaped newlines and tabs with actual line breaks and spaces
    return text.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
  };
  return <div className="mt-8 space-y-4">
      {/* Request Collapsible */}
      <Collapsible open={isRequestOpen} onOpenChange={setIsRequestOpen} className="border border-gray-200 rounded-md shadow overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-white px-4 py-3 font-medium text-left">
          <span>🔻 Request do serviço atual (RLIWAIT)</span>
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
          <span>🔻 Response do serviço anterior (RLIDEAL)</span>
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
    </div>;
};
export default TechnicalDocumentation;