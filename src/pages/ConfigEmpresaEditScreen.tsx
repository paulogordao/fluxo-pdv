import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Building2, ArrowLeft } from "lucide-react";
import PermissionModal from "@/components/PermissionModal";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";
import { empresaService, type Empresa } from "@/services/empresaService";
import { credentialsService, type CredentialListItem } from "@/services/credentialsService";
import { clearUserSessionCache } from "@/utils/cacheUtils";

const empresaEditSchema = z.object({
  nome: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(1, "CNPJ é obrigatório"),
  email: z.string().optional().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Email deve ter um formato válido"),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  descricao: z.string().optional(),
  tipo_simulacao: z.string().optional(),
  id_credencial: z.string().optional(),
});

type EmpresaEditFormData = z.infer<typeof empresaEditSchema>;

const ConfigEmpresaEditScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");
  const [empresaData, setEmpresaData] = useState<Empresa | null>(null);
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EmpresaEditFormData>({
    resolver: zodResolver(empresaEditSchema),
  });

  // Load empresa data and credentials on component mount
  useEffect(() => {
    if (id) {
      fetchEmpresaData(id);
      fetchCredentials();
    } else {
      navigate("/config_empresa_list");
    }
  }, [id, navigate]);

  const fetchCredentials = async () => {
    try {
      setIsLoadingCredentials(true);
      const credentialsList = await credentialsService.getCredentials();
      setCredentials(credentialsList);
    } catch (error) {
      console.error("Erro ao buscar credenciais:", error);
      // Don't show error toast as credentials are optional
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const fetchEmpresaData = async (empresaId: string) => {
    try {
      setIsLoadingData(true);
      
      const userUUID = sessionStorage.getItem("user.uuid");
      
      if (!userUUID) {
        setPermissionMessage("Sessão expirada. Faça login novamente.");
        setShowPermissionModal(true);
        return;
      }

      console.log("Buscando dados da empresa:", empresaId);
      
      const data = await empresaService.getEmpresaById(empresaId, userUUID);
      console.log("Dados da empresa recebidos:", data);
      
      setEmpresaData(data);
      
      // Preencher o formulário com os dados recebidos
      setValue("nome", data.nome);
      setValue("cnpj", data.cnpj);
      setValue("email", data.email || "");
      setValue("telefone", data.telefone || "");
      setValue("endereco", data.endereco || "");
      setValue("descricao", data.descricao || "");
      setValue("tipo_simulacao", data.tipo_simulacao || "");
      setValue("id_credencial", data.id_credencial || "");
      
    } catch (error) {
      console.error("Erro ao buscar dados da empresa:", error);
      toast.error("Erro ao carregar dados da empresa. Tente novamente.");
      navigate("/config_empresa_list");
    } finally {
      setIsLoadingData(false);
    }
  };

  const formatTelefone = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length <= 10) {
      return cleanValue.replace(/(\d{2})(\d{4})(\d)/, "($1) $2-$3");
    } else {
      return cleanValue.replace(/(\d{2})(\d{5})(\d)/, "($1) $2-$3").slice(0, 15);
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value);
    setValue("telefone", formatted);
  };

  const onSubmit = async (data: EmpresaEditFormData) => {
    if (!id || !empresaData) {
      toast.error("Erro: dados da empresa não encontrados.");
      return;
    }

    try {
      setIsLoading(true);
      
      const userUUID = sessionStorage.getItem("user.uuid");
      
      if (!userUUID) {
        setPermissionMessage("Sessão expirada. Faça login novamente.");
        setShowPermissionModal(true);
        return;
      }

      console.log("Atualizando empresa:", id, "com dados:", data);

      const responseData = await empresaService.updateEmpresa(id, data, userUUID);
      console.log("Resposta da atualização:", responseData);

      if (responseData.code === "200" || responseData.code === 200) {
        // Limpar cache da sessão para forçar reload dos dados atualizados
        clearUserSessionCache();
        
        toast.success("Empresa atualizada com sucesso!");
        // Aguardar um pouco antes de redirecionar para que o usuário veja a mensagem
        setTimeout(() => {
          navigate("/config_empresa_list");
        }, 1500);
      } else {
        throw new Error(responseData.mensagem || "Erro ao atualizar empresa");
      }
      
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      toast.error("Erro ao atualizar empresa. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/config_empresa_list");
  };

  const handlePermissionModalClose = () => {
    setShowPermissionModal(false);
    navigate("/index");
  };

  if (isLoadingData) {
    return (
      <ConfigLayoutWithSidebar>
        <Card className="w-full max-w-md p-6 shadow-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dotz-laranja mx-auto mb-4"></div>
            <p>Carregando dados da empresa...</p>
          </div>
        </Card>
      </ConfigLayoutWithSidebar>
    );
  }

  return (
    <>
      <ConfigLayoutWithSidebar>
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/config_empresa_list")}
                className="text-gray-600 hover:text-dotz-laranja"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="flex items-center justify-center space-x-3 text-2xl text-dotz-laranja flex-1">
                <Building2 className="h-8 w-8" />
                <span>Editar Empresa</span>
              </CardTitle>
              <div className="w-10"></div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Empresa *</Label>
                  <Input
                    id="nome"
                    {...register("nome")}
                    placeholder="Digite o nome da empresa"
                    className={errors.nome ? "border-red-500" : ""}
                  />
                  {errors.nome && (
                    <p className="text-sm text-red-500">{errors.nome.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    {...register("cnpj")}
                    placeholder="XX.XXX.XXX/XXXX-XX"
                    value={watch("cnpj") || ""}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500">🔒 CNPJ não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail da Empresa</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="empresa@exemplo.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    {...register("telefone")}
                    placeholder="(XX) XXXXX-XXXX"
                    onChange={handleTelefoneChange}
                    value={watch("telefone") || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_simulacao">Tipo de Simulação</Label>
                  <Select
                    value={watch("tipo_simulacao") || ""}
                    onValueChange={(value) => setValue("tipo_simulacao", value)}
                  >
                    <SelectTrigger className="bg-background border border-border">
                      <SelectValue placeholder="Selecione o tipo de simulação" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      <SelectItem value="OFFLINE">OFFLINE</SelectItem>
                      <SelectItem value="Versão 1">Versão 1</SelectItem>
                      <SelectItem value="Versão 2">Versão 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_credencial">Credencial Associada</Label>
                  <Select
                    value={watch("id_credencial") || ""}
                    onValueChange={(value) => setValue("id_credencial", value === "none" ? "" : value)}
                    disabled={isLoadingCredentials}
                  >
                    <SelectTrigger className="bg-background border border-border">
                      <SelectValue placeholder={
                        isLoadingCredentials 
                          ? "Carregando credenciais..." 
                          : "Selecione uma credencial"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {credentials
                        .filter(credential => credential.enabled)
                        .map((credential) => (
                          <SelectItem 
                            key={credential.partner_id} 
                            value={credential.partner_id}
                          >
                            {credential.description}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {credentials.length === 0 && !isLoadingCredentials && (
                    <p className="text-xs text-gray-500">Nenhuma credencial disponível</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  {...register("endereco")}
                  placeholder="Rua, número, bairro, cidade, estado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  {...register("descricao")}
                  placeholder="Informações adicionais sobre a empresa"
                  rows={4}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  variant="dotz"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  type="button"
                  variant="cancel"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
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

export default ConfigEmpresaEditScreen;
