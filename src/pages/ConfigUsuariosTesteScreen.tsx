
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FlaskConical } from "lucide-react";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";

const ConfigUsuariosTesteScreen = () => {
  const navigate = useNavigate();

  return (
    <ConfigLayoutWithSidebar>
      <div className="space-y-6 w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/configuracoes")}
              className="text-gray-600 hover:text-dotz-laranja"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-dotz-laranja">Usuários de teste</h1>
          </div>
        </div>

        <div className="p-4 bg-dotz-offwhite rounded-md border border-dotz-pessego">
          <h2 className="font-semibold mb-2 text-dotz-laranja">Configurações do fluxo</h2>
          <p>Configure os usuários de teste para o fluxo do sistema.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-dotz-laranja">
              <FlaskConical className="h-6 w-6" />
              <span>Usuários de teste</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Esta funcionalidade estará disponível em breve. 
              Aqui você poderá gerenciar os usuários de teste do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    </ConfigLayoutWithSidebar>
  );
};

export default ConfigUsuariosTesteScreen;
