import { useState } from "react";
import { ChevronUp, ChevronDown, FileText, Clock } from "lucide-react";
import TechnicalDocumentation from "@/components/technical/TechnicalDocumentation";

interface TechnicalFooterProps {
  requestData?: string;
  responseData?: string;
  previousRequestData?: string;
  isLoading?: boolean;
  slug?: string;
  loadOnMount?: boolean;
  sourceScreen?: string;
}

const TechnicalFooter = ({
  requestData,
  responseData,
  previousRequestData,
  isLoading = false,
  slug,
  loadOnMount = true,
  sourceScreen
}: TechnicalFooterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Toggle Tab */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gray-800 text-white px-6 py-3 flex items-center justify-center gap-3 hover:bg-gray-700 transition-all duration-200 shadow-lg"
        title={isExpanded ? "Fechar Informações Técnicas" : "Abrir Informações Técnicas"}
      >
        <FileText className="w-5 h-5" />
        <span className="font-medium">Informações Técnicas</span>
        {isLoading && <Clock className="w-4 h-4 animate-spin" />}
        {isExpanded ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <ChevronUp className="w-5 h-5" />
        )}
      </button>

      {/* Expandable Panel */}
      <div 
        className={`transition-all duration-300 ease-in-out bg-white border-t border-gray-200 shadow-2xl overflow-hidden ${
          isExpanded 
            ? 'max-h-[70vh] opacity-100' 
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <TechnicalDocumentation
            requestData={requestData}
            responseData={responseData}
            previousRequestData={previousRequestData}
            isLoading={isLoading}
            slug={slug}
            loadOnMount={loadOnMount}
            sourceScreen={sourceScreen}
          />
        </div>
      </div>
    </div>
  );
};

export default TechnicalFooter;