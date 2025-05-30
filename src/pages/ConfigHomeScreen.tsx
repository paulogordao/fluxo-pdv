
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ArrowLeft } from "lucide-react";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";

const ConfigHomeScreen = () => {
  const navigate = useNavigate();

  return (
    <ConfigLayoutWithSidebar>
      <div className="space-y-6 w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/index")}
              className="text-gray-600 hover:text-dotz-laranja"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-dotz-laranja">Configurações</h1>
          </div>
        </div>

        <Card className="border border-dotz-pessego">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-dotz-laranja rounded-full">
                <Settings className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-dotz-laranja">Configurações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
              Nesta seção você pode acessar as configurações relacionadas à empresa, usuários e ao fluxo do sistema. 
              O conteúdo disponível será adaptado de acordo com as permissões do seu perfil.
            </p>
            <div className="mt-6 p-4 bg-dotz-offwhite rounded-md border border-dotz-pessego">
              <p className="text-sm text-gray-700">
                💡 <strong>Dica:</strong> Use o menu lateral para navegar entre as diferentes seções de configuração disponíveis.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg text-dotz-laranja flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configurações Disponíveis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Cadastro e edição de empresas</li>
                <li>• Gerenciamento de usuários</li>
                <li>• Configurações do fluxo de teste</li>
                <li>• Permissões e acessos</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg text-dotz-laranja flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Acesso Baseado em Perfil</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                As opções do menu lateral são exibidas conforme suas permissões. 
                Caso não visualize alguma funcionalidade, entre em contato com o administrador do sistema.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ConfigLayoutWithSidebar>
  );
};

export default ConfigHomeScreen;
