
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PdvProvider } from "@/context/PdvContext";
import { useNavigate } from "react-router-dom";
import GuiaDeNavegacaoAPI from "@/components/GuiaDeNavegacaoAPI";
import UserProfileButton from "@/components/UserProfileButton";
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ userName: "Usuário", companyName: "Empresa" });

  useEffect(() => {
    // Get user info from sessionStorage (set during login)
    const storedUserName = sessionStorage.getItem("user_name");
    const storedCompanyName = sessionStorage.getItem("company_name");
    
    if (storedUserName || storedCompanyName) {
      setUserInfo({
        userName: storedUserName || "Usuário",
        companyName: storedCompanyName || "Empresa"
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* User Profile Button - positioned in top left with larger size */}
      <div className="absolute top-6 left-6">
        <UserProfileButton 
          userName={userInfo.userName}
          companyName={userInfo.companyName}
        />
      </div>

      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Simulador PDV</CardTitle>
          <CardDescription className="text-lg">
            Demonstração técnica para integração com API
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="p-4 bg-dotz-offwhite rounded-md border border-dotz-pessego">
            <h2 className="font-semibold mb-2 text-dotz-laranja">Sobre esta simulação</h2>
            <p>Este simulador demonstra o fluxo de atendimento em um PDV e as chamadas à API necessárias para integração. Cada tela destaca os endpoints que devem ser utilizados e em qual momento.</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <h2 className="font-semibold mb-2">Fluxo demonstrado</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Tela de boas-vindas ao PDV</li>
              <li>Tela de início da compra</li>
              <li>Questionamento se cliente quer participar do programa</li>
              <li>Tela de identificação do cliente</li>
              <li>Tela de captura de celular</li>
              <li>Tela de pagamento</li>
              <li>Tela de tipos de pagamento</li>
              <li>Telas de confirmação de pagamento</li>
              <li>Tela de finalização de compra</li>
            </ol>
          </div>
          
          <div className="flex justify-center">
            <PdvProvider>
              <Button size="lg" className="px-8 py-6 text-lg bg-dotz-laranja hover:bg-dotz-laranja/90 text-white" onClick={() => navigate('/welcome')}>
                Iniciar Simulação
              </Button>
            </PdvProvider>
          </div>
        </CardContent>
      </Card>
      
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>Simulador PDV - Guia Técnico de Integração</p>
      </footer>
      
      {/* Navigation Guide Component */}
      <GuiaDeNavegacaoAPI />
    </div>
  );
};

export default Index;
