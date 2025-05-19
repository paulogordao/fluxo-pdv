
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PdvProvider } from "@/context/PdvContext";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">
            Simulador PDV Self-Checkout
          </CardTitle>
          <CardDescription className="text-lg">
            Demonstração técnica para integração com API
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
            <h2 className="font-semibold mb-2 text-blue-700">Sobre esta simulação</h2>
            <p>
              Este simulador demonstra o fluxo de atendimento em um PDV self-checkout 
              e as chamadas à API necessárias para integração. Cada tela destaca os 
              endpoints que devem ser utilizados e em qual momento.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <h2 className="font-semibold mb-2">Fluxo demonstrado</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Tela de boas-vindas ao PDV</li>
              <li>Tela de início de atendimento</li>
              <li>Tela de leitura de produto</li>
            </ol>
          </div>
          
          <div className="flex justify-center">
            <PdvProvider>
              <Button 
                size="lg" 
                className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/welcome')}
              >
                Iniciar Simulação
              </Button>
            </PdvProvider>
          </div>
        </CardContent>
      </Card>
      
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>Simulador PDV Self-Checkout - Guia Técnico de Integração</p>
      </footer>
    </div>
  );
};

export default Index;
