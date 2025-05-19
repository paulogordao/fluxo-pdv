
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <h1 className="text-4xl font-bold mb-4 text-dotz-laranja">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Página não encontrada</p>
        <p className="mb-6 text-gray-500">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button 
          onClick={() => navigate('/')}
          className="bg-dotz-laranja hover:bg-dotz-laranja/90"
        >
          Voltar para o Início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
