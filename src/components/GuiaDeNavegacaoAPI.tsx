
import { useLocation } from "react-router-dom";

const GuiaDeNavegacaoAPI = () => {
  const location = useLocation();
  const pathname = location.pathname;
  
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
    <div className="fixed top-0 right-0 h-screen w-72 bg-white border-l border-gray-200 p-4 text-sm shadow-sm overflow-y-auto z-50 hidden md:block">
      <h2 className="text-base font-semibold mb-4">🧭 Navegação API's</h2>
      <ul className="space-y-2">
        {navigationItems.map((item, index) => {
          // Handle single route or multiple routes
          const isItemActive = item.route 
            ? isActive(item.route) 
            : item.routes?.some(route => pathname === route);
            
          // Special case for the final step
          const isLastItem = index === navigationItems.length - 1;
          
          return (
            <li 
              key={item.route || index} 
              className={`${isItemActive ? 'text-blue-600 font-bold' : 'text-gray-700'}`}
            >
              {isItemActive ? '➡️ ' : ''}{item.label}
              {item.endpoint && (
                <div className="ml-4 text-sm text-gray-600">• {item.endpoint}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default GuiaDeNavegacaoAPI;
