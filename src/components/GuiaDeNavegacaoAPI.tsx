
import { useLocation } from "react-router-dom";

const GuiaDeNavegacaoAPI = () => {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Function to check if the current route is active
  const isActive = (route: string) => {
    return pathname === route;
  };

  // Navigation items with routes and API endpoints
  const navigationItems = [
    { label: "Boas-vindas (tela \"Home\")", route: "/", endpoint: null },
    { label: "Início de compra", route: "/welcome", endpoint: null },
    { label: "Identificação cliente", route: "/cpf", endpoint: "RLIINFO" },
    { label: "Captura do telefone", route: "/telefone", endpoint: "RLICELL" },
    { label: "Envio da compra", route: "/scan", endpoint: "RLIFUND" },
    { label: "Meios de pagamento", route: "/meios_de_pagamento", endpoint: "RLIDEAL" },
    { label: "Confirmação pagamento via App", route: "/confirmacao_pagamento_app", endpoint: "RLIWAIT" },
    { label: "Confirmação final", route: "/confirmacao_pagamento", endpoint: "RLIPAYS" },
  ];

  return (
    <div className="fixed top-0 right-0 h-screen w-72 bg-white border-l p-4 text-sm shadow-sm overflow-y-auto z-10 hidden md:block">
      <h2 className="text-base font-semibold mb-4">🧭 Navegação API's</h2>
      <ul className="space-y-2">
        {navigationItems.map((item) => (
          <li 
            key={item.route} 
            className={`${isActive(item.route) ? 'text-blue-600 font-bold' : 'text-gray-700'}`}
          >
            {isActive(item.route) ? '➡️ ' : ''}{item.label} ({item.route})
            {item.endpoint && (
              <div className="ml-4 text-sm text-gray-600">• {item.endpoint}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GuiaDeNavegacaoAPI;
