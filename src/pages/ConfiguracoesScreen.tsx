
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft } from "lucide-react";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";

const ConfiguracoesScreen = () => {
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

        <div className="p-4 bg-dotz-offwhite rounded-md border border-dotz-pessego">
          <h2 className="font-semibold mb-2 text-dotz-laranja">Área Administrativa</h2>
          <p>Acesse as configurações do sistema e gerencie as informações da empresa.</p>
        </div>

        <div className="grid gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/config_empresa")}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-dotz-laranja">
                <Building2 className="h-6 w-6" />
                <span>Cadastro de Empresa</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Configure as informações da empresa: nome, CNPJ, contatos e endereço.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ConfigLayoutWithSidebar>
  );
};

export default ConfiguracoesScreen;
