
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, ArrowLeft, Loader2, Check, Trash2 } from "lucide-react";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { userService, CreateUserData, AccessRequest } from "@/services/userService";
import { permissionService } from "@/services/permissionService";
import { empresaService, Empresa } from "@/services/empresaService";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { credentialsService } from "@/services/credentialsService";
import { getUserId } from "@/utils/userUtils";
import PermissionModal from "@/components/PermissionModal";
import { createLogger } from '@/utils/logger';

const log = createLogger('ConfigUsuarioNovoScreen');

const ConfigUsuarioNovoScreen = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = useUserPermissions();

  // Form state
  const [formData, setFormData] = useState({
    usuario: "",
    nome: "",
    email: "",
    perfil: "",
    empresa: ""
  });

  // Permission modal state
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");

  // Get user ID using centralized utility
  const userId = getUserId();

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserData) => {
      if (!userId) throw new Error('No user ID available');
      return userService.createUser(userData, userId);
    },
    onSuccess: (data) => {
      if (data.status === 'ok' && data.code === 200) {
        toast({
          title: "✅ Cadastro efetuado com sucesso!",
          description: data.mensagem,
        });
        
        // Clear form
        setFormData({
          usuario: "",
          nome: "",
          email: "",
          perfil: "",
          empresa: ""
        });
        
        // Redirect to user list after success
        setTimeout(() => {
          navigate("/config_usuario_edit");
        }, 2000);
      }
    },
    onError: (error) => {
      log.error('Error creating user:', error);
      toast({
        title: "Erro ao cadastrar usuário",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Fetch user permissions
  const { data: permissionsData } = useQuery({
    queryKey: ['userPermissions', userId],
    queryFn: () => {
      if (!userId) throw new Error('No user ID available');
      return permissionService.getUserPermissions(userId);
    },
    enabled: !!userId,
  });

  // Fetch empresas
  const { data: empresasData, isLoading: empresasLoading, error: empresasError } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => {
      if (!userId) throw new Error('No user ID available');
      return empresaService.getEmpresas(userId);
    },
    enabled: !!userId,
  });

  // Fetch access requests
  const { data: accessRequestsData, isLoading: requestsLoading, error: requestsError } = useQuery({
    queryKey: ['accessRequests', userId],
    queryFn: () => {
      if (!userId) throw new Error('No user ID available');
      return userService.getAccessRequests(userId);
    },
    enabled: !!userId,
  });

  // Generate perfil options based on permissions
  const getPerfilOptions = () => {
    if (!permissionsData?.data) return [];
    
    const hasCreateRootPermission = permissionsData.data.some(
      (item: any) => item.permissao === 'criar_usuario_root'
    );
    
    if (hasCreateRootPermission) {
      return [
        { value: 'ROOT', label: 'ROOT' },
        { value: 'ADMIN', label: 'ADMIN' },
        { value: 'USER', label: 'USER' }
      ];
    } else {
      return [
        { value: 'ADMIN', label: 'ADMIN' },
        { value: 'USER', label: 'USER' }
      ];
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

  const handleSave = () => {
    // Validate required fields
    if (!formData.usuario || !formData.nome || !formData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios marcados com *",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for API
    const userData: CreateUserData = {
      usuario: formData.usuario,
      nome: formData.nome,
      email: formData.email,
      empresa_id: formData.empresa,
      perfil: formData.perfil
    };

    createUserMutation.mutate(userData);
  };

  const handleCancel = () => {
    navigate("/config_usuario_edit");
  };

  const handleApproveRequest = (request: AccessRequest) => {
    setFormData(prev => ({
      ...prev,
      nome: request.nome,
      email: request.email
    }));
    
    toast({
      title: "Dados preenchidos",
      description: "Nome e email foram preenchidos automaticamente",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Validar se campos obrigatórios estão preenchidos
  const isFieldEmpty = (field: string) => {
    return !formData[field as keyof typeof formData];
  };

  const perfilOptions = getPerfilOptions();
  const empresas: Empresa[] = empresasData || [];
  const accessRequests: AccessRequest[] = accessRequestsData?.data || [];

  return (
    <ConfigLayoutWithSidebar>
      <div className="space-y-6 w-full max-w-6xl">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="text-gray-600 hover:text-dotz-laranja"
              disabled={createUserMutation.isPending}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-dotz-laranja">Cadastro de Novo Usuário</h1>
          </div>
        </div>

        <Card className="border-dotz-laranja/20 bg-dotz-laranja/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-red-600" />
                <h2 className="text-xl font-semibold text-red-600">Criar Usuário no Sistema</h2>
              </div>
              <p className="text-gray-600">
                Preencha os campos abaixo para criar um novo usuário e atribuir suas permissões. Os dados cadastrados darão acesso ao simulador e às funcionalidades conforme perfil selecionado.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg">
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-sm font-medium text-gray-700">
                  Usuário <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="usuario"
                  value={formData.usuario}
                  onChange={(e) => handleInputChange('usuario', e.target.value)}
                  placeholder="Digite o nome de usuário"
                  className={`w-full ${isFieldEmpty('usuario') ? 'border-red-300' : ''}`}
                  disabled={createUserMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Digite o nome completo"
                  className={`w-full ${isFieldEmpty('nome') ? 'border-red-300' : ''}`}
                  disabled={createUserMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  E-mail <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Digite o e-mail"
                  className={`w-full ${isFieldEmpty('email') ? 'border-red-300' : ''}`}
                  disabled={createUserMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="perfil" className="text-sm font-medium text-gray-700">
                  Perfil
                </Label>
                <Select 
                  value={formData.perfil} 
                  onValueChange={(value) => handleInputChange('perfil', value)}
                  disabled={createUserMutation.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfilOptions.length > 0 ? (
                      perfilOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="placeholder" disabled>
                        Erro ao carregar opções
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="empresa" className="text-sm font-medium text-gray-700">
                  Empresa
                </Label>
                <Select 
                  value={formData.empresa} 
                  onValueChange={handleEmpresaChange}
                  disabled={createUserMutation.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresasLoading ? (
                      <SelectItem value="loading" disabled>
                        Carregando...
                      </SelectItem>
                    ) : empresasError ? (
                      <SelectItem value="error" disabled>
                        Erro ao carregar opções
                      </SelectItem>
                    ) : empresas.length > 0 ? (
                      empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nome}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="empty" disabled>
                        Nenhuma empresa disponível
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="px-6"
                disabled={createUserMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                variant="dotz"
                className="px-6"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Access Requests Table */}
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-dotz-laranja">
              Solicitações de Acesso Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Carregando solicitações...</span>
              </div>
            ) : requestsError ? (
              <div className="text-center py-8 text-red-600">
                Erro ao carregar solicitações de acesso
              </div>
            ) : accessRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome da empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Data de criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.nome}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>{request.nome_empresa}</TableCell>
                      <TableCell>{request.cnpj_empresa}</TableCell>
                      <TableCell>{formatDate(request.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="dotz"
                            onClick={() => handleApproveRequest(request)}
                            className="text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Apagar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma solicitação de acesso pendente
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        message={permissionMessage}
      />
    </ConfigLayoutWithSidebar>
  );
};

export default ConfigUsuarioNovoScreen;
