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
import { userService, UsuarioData } from "@/services/userService";
import { empresaService, Empresa } from "@/services/empresaService";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { credentialsService } from "@/services/credentialsService";
import { clearUserSessionCache } from "@/utils/cacheUtils";

const ConfigUsuarioEditIndividualScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useUserPermissions();
  const [userData, setUserData] = useState<UsuarioData | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEmpresas, setIsLoadingEmpresas] = useState(true);
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
      fetchEmpresas();
    }
  }, [id]);

  const fetchUserData = async (userId: string) => {
    try {
      setIsLoading(true);
      
      const userEmail = sessionStorage.getItem("user.login");
      const userUUID = sessionStorage.getItem("user.uuid");
      
      if (!userEmail || !userUUID) {
        setPermissionMessage("Sessão expirada. Faça login novamente.");
        setShowPermissionModal(true);
        return;
      }

      console.log("Buscando dados do usuário:", userId);
      
      const data = await userService.getUserById(userId, userUUID);
      console.log("Dados do usuário recebidos:", data);
      
      setUserData(data);
      setFormData({
        usuario: data.usuario || "",
        nome: data.nome || "",
        email: data.email || "",
        empresa: data.empresa_id || ""
      });
      
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      toast.error("Erro ao carregar dados do usuário. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmpresas = async () => {
    try {
      setIsLoadingEmpresas(true);
      
      const userEmail = sessionStorage.getItem("user.login");
      const userUUID = sessionStorage.getItem("user.uuid");
      
      if (!userEmail || !userUUID) {
        console.error("Sessão expirada para buscar empresas");
        return;
      }

      console.log("Buscando empresas...");
      
      const data = await empresaService.getEmpresas(userUUID);
      console.log("Dados das empresas recebidos:", data);
      
      setEmpresas(data);
      
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
      toast.error("Erro ao carregar empresas. Tente novamente.");
    } finally {
      setIsLoadingEmpresas(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const checkCompanyCredential = async (empresaId: string) => {
    try {
      // Find the selected empresa to get id_credencial
      const selectedEmpresa = empresas.find(emp => emp.id === empresaId);
      
      if (selectedEmpresa?.id_credencial) {
        // Fetch credential details
        const credentialData = await credentialsService.getCredentialById(selectedEmpresa.id_credencial);
        
        // Check if it's production environment and user has permission
        if (credentialData.ambiente === "prod" && !hasPermission("associar_usuario_ambiente_produtivo")) {
          setPermissionMessage("A empresa selecionada esta com credencial para ambiente produtivo, somente usuários ROOT podem fazer essa associação, procure um administrador!");
          setShowPermissionModal(true);
          
          // Reset empresa selection
          setFormData(prev => ({
            ...prev,
            empresa: ""
          }));
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao verificar credencial da empresa:', error);
      // Don't show error to user, let them proceed if credential check fails
    }
  };

  const handleEmpresaChange = (value: string) => {
    handleInputChange('empresa', value);
    if (value) {
      checkCompanyCredential(value);
    }
  };

  const handleSave = async () => {
    try {
      const userUUID = sessionStorage.getItem("user.uuid");
      
      if (!userUUID) {
        setPermissionMessage("Sessão expirada. Faça login novamente.");
        setShowPermissionModal(true);
        return;
      }

      if (!userData?.id) {
        toast.error("ID do usuário não encontrado.");
        return;
      }

      console.log("Dados para salvar:", formData);
      
      const requestBody = {
        usuario: formData.usuario,
        nome: formData.nome,
        email: formData.email,
        id: userData.id,
        empresa_id: formData.empresa
      };

      console.log("Enviando PUT request:", requestBody);

      const data = await userService.updateUser(requestBody, userUUID);
      console.log("Resposta da API PUT:", data);
      
      if (data.status === "ok") {
        toast.success("Usuário atualizado com sucesso!");
        
        // Clear user session cache to force refresh of user data
        clearUserSessionCache();
        
        // Small delay to allow the cache clear to complete before navigation
        setTimeout(() => {
          navigate("/config_usuario_edit");
        }, 100);
      } else {
        toast.error("Erro ao atualizar usuário. Tente novamente.");
      }
      
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast.error("Erro ao salvar usuário. Tente novamente.");
    }
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
                <Select 
                  value={formData.empresa} 
                  onValueChange={handleEmpresaChange}
                  disabled={isLoadingEmpresas}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingEmpresas ? (
                      <SelectItem value="loading" disabled>
                        Carregando empresas...
                      </SelectItem>
                    ) : empresas.length === 0 ? (
                      <SelectItem value="no-company" disabled>
                        Nenhuma empresa disponível
                      </SelectItem>
                    ) : (
                      empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nome} - {empresa.cnpj}
                        </SelectItem>
                      ))
                    )}
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
