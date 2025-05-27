
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { User, ArrowLeft } from "lucide-react";
import PermissionModal from "@/components/PermissionModal";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";

interface UsuarioData {
  usuario: string;
  nome: string;
  email: string;
  empresa: string;
  criado_em: string;
  id: string;
}

const ConfigUsuarioEditIndividualScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<UsuarioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    usuario: "",
    nome: "",
    email: "",
    empresa: ""
  });

  useEffect(() => {
    if (id) {
      fetchUserData(id);
    }
  }, [id]);

  const fetchUserData = async (userId: string) => {
    try {
      setIsLoading(true);
      
      const userEmail = sessionStorage.getItem("user.login");
      const userUUID = sessionStorage.getItem("user.uuid");
      const apiKey = '0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975';
      
      if (!userEmail || !userUUID) {
        setPermissionMessage("Sessão expirada. Faça login novamente.");
        setShowPermissionModal(true);
        return;
      }

      console.log("Buscando dados do usuário:", userId);
      
      const response = await fetch(`https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/usuarios?id_usuario_consulta=${userId}`, {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "id_usuario": userUUID,
          "User-Agent": "SimuladorPDV/1.0"
        }
      });

      console.log("Status da resposta:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Erro da API:", errorText);
        throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Dados do usuário recebidos:", data);
      
      setUserData(data);
      setFormData({
        usuario: data.usuario || "",
        nome: data.nome || "",
        email: data.email || "",
        empresa: data.empresa || ""
      });
      
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      toast.error("Erro ao carregar dados do usuário. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // TODO: Implementar salvamento
    console.log("Dados para salvar:", formData);
    toast.info("Funcionalidade de salvamento será implementada em breve.");
  };

  const handleCancel = () => {
    navigate("/config_usuario_edit");
  };

  const handlePermissionModalClose = () => {
    setShowPermissionModal(false);
    navigate("/index");
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <ConfigLayoutWithSidebar>
        <Card className="w-full max-w-4xl shadow-lg">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dotz-laranja mr-4"></div>
            <p>Carregando dados do usuário...</p>
          </div>
        </Card>
      </ConfigLayoutWithSidebar>
    );
  }

  if (!userData) {
    return (
      <ConfigLayoutWithSidebar>
        <Card className="w-full max-w-4xl shadow-lg">
          <CardContent className="p-8">
            <div className="text-center">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Usuário não encontrado</p>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="mt-4"
              >
                Voltar para a lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </ConfigLayoutWithSidebar>
    );
  }

  return (
    <>
      <ConfigLayoutWithSidebar>
        <Card className="w-full max-w-4xl shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="text-gray-600 hover:text-dotz-laranja"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="flex items-center justify-center space-x-3 text-2xl text-dotz-laranja flex-1">
                <User className="h-8 w-8" />
                <span>Editar Usuário</span>
              </CardTitle>
              <div className="w-10"></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-sm font-medium text-gray-700">
                  Usuário
                </Label>
                <Input
                  id="usuario"
                  value={formData.usuario}
                  onChange={(e) => handleInputChange('usuario', e.target.value)}
                  placeholder="Digite o nome de usuário"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                  Nome
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Digite o nome completo"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Digite o e-mail"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="empresa" className="text-sm font-medium text-gray-700">
                  Empresa
                </Label>
                <Select value={formData.empresa} onValueChange={(value) => handleInputChange('empresa', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* TODO: Carregar opções de empresas em uma etapa futura */}
                    <SelectItem value="" disabled>
                      Nenhuma empresa disponível
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {userData.criado_em && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500">
                  <strong>Criado em:</strong> {formatDate(userData.criado_em)}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="px-6"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                variant="dotz"
                className="px-6"
              >
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      </ConfigLayoutWithSidebar>

      <PermissionModal
        isOpen={showPermissionModal}
        onClose={handlePermissionModalClose}
        message={permissionMessage}
      />
    </>
  );
};

export default ConfigUsuarioEditIndividualScreen;
