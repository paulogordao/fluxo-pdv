
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const GuiaDeNavegacaoAPI = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Function to check if the current route is active
  const isActive = (route: string) => {
    return pathname === route || 
      // Special case for confirmation routes
      (route === "/confirmacao_pagamento" && 
        (pathname === "/confirmacao_pagamento_token" || pathname === "/otp_data_nascimento"));
  };

  // Navigation items with routes and API endpoints
  const navigationItems = [
    { label: "Boas vindas", route: "/", endpoint: null },
    { label: "Início de compra", route: "/welcome", endpoint: null },
    { label: "Identificação cliente", route: "/cpf", endpoint: "RLIINFO" },
    { label: "Captura do telefone", route: "/telefone", endpoint: "RLICELL" },
    { label: "Envio da compra", route: "/scan", endpoint: "RLIFUND" },
    { label: "Meios de pagamento", route: "/meios_de_pagamento", endpoint: "RLIDEAL" },
    { label: "Confirmação pagamento (APP)", route: "/confirmacao_pagamento_app", endpoint: "RLIWAIT" },
    { 
      label: "Confirmação pagamento (PDV)", 
      routes: ["/confirmacao_pagamento_token", "/otp_data_nascimento"], 
      endpoint: "RLIAUTH" 
    },
    { label: "Finalização da compra", route: "/confirmacao_pagamento", endpoint: "RLIPAYS" },
  ];

  return (
    <div className="fixed top-4 right-4 z-50 hidden lg:block">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
        title={isExpanded ? "Fechar Navegação API's" : "Abrir Navegação API's"}
      >
        {isExpanded ? (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Expandable Panel */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isExpanded 
            ? 'w-64 opacity-100 translate-x-0' 
            : 'w-0 opacity-0 translate-x-full'
        } bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden`}
      >
        <div className="p-3 text-xs overflow-y-auto max-h-[calc(100vh-6rem)]">
          <h2 className="text-sm font-semibold mb-3 text-gray-800 flex items-center gap-2">
            🧭 Navegação API's
          </h2>
          <ul className="space-y-1.5">
            {navigationItems.map((item, index) => {
              // Handle single route or multiple routes
              const isItemActive = item.route 
                ? isActive(item.route) 
                : item.routes?.some(route => pathname === route);
                
              return (
                <li 
                  key={item.route || index} 
                  className={`${isItemActive ? 'text-blue-600 font-semibold' : 'text-gray-700'} leading-tight`}
                >
                  <div className="flex items-start">
                    {isItemActive ? '➡️ ' : ''}
                    <span className="flex-1">{item.label}</span>
                  </div>
                  {item.endpoint && (
                    <div className="ml-3 text-xs text-gray-500 font-mono">• {item.endpoint}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GuiaDeNavegacaoAPI;
