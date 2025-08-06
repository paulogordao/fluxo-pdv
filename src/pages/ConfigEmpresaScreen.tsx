import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Building2, ArrowLeft, Search, Loader2 } from "lucide-react";
import PermissionModal from "@/components/PermissionModal";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";
import { empresaService, type CreateEmpresaData } from "@/services/empresaService";
import { brasilApiService } from "@/services/brasilApiService";
import { useUserPermissions } from "@/hooks/useUserPermissions";

const empresaSchema = z.object({
  nome: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(1, "CNPJ é obrigatório").regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX"),
  email: z.string().optional().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Email deve ter um formato válido"),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  descricao: z.string().optional(),
  tipo_simulacao: z.string().optional(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

const ConfigEmpresaScreen = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCNPJ, setIsFetchingCNPJ] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");

  const { hasPermission, isLoading: isCheckingPermission, error } = useUserPermissions();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
  });

  // Check user permissions on component mount
  useEffect(() => {
    if (!isCheckingPermission && !error) {
      const userEmail = sessionStorage.getItem("user.login");
      const userUUID = sessionStorage.getItem("user.uuid");
      
      if (!userEmail || !userUUID) {
        setPermissionMessage("Sessão expirada. Faça login novamente.");
        setShowPermissionModal(true);
        return;
      }

      if (!hasPermission("menu_empresa_novo")) {
        setPermissionMessage("Você não possui permissão para acessar esta funcionalidade.");
        setShowPermissionModal(true);
        return;
      }
    }

    if (error) {
      setPermissionMessage("Erro ao verificar permissões. Tente novamente.");
      setShowPermissionModal(true);
    }
  }, [hasPermission, isCheckingPermission, error]);

  const formatCNPJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    const formattedValue = cleanValue
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
    return formattedValue;
  };

  const formatTelefone = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length <= 10) {
      return cleanValue.replace(/(\d{2})(\d{4})(\d)/, "($1) $2-$3");
    } else {
      return cleanValue.replace(/(\d{2})(\d{5})(\d)/, "($1) $2-$3").slice(0, 15);
    }
  };

  const isValidCNPJ = (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, "");
    return cleanCNPJ.length === 14;
  };

  const fetchCNPJData = async (cnpj: string) => {
    if (!isValidCNPJ(cnpj)) return;

    setIsFetchingCNPJ(true);
    
    try {
      console.log('Buscando dados do CNPJ:', cnpj);
      const cnpjData = await brasilApiService.consultarCNPJ(cnpj);
      console.log('Dados recebidos da API:', cnpjData);

      // Preencher os campos automaticamente
      if (cnpjData.razao_social) {
        setValue("nome", cnpjData.razao_social);
      }

      if (cnpjData.email) {
        setValue("email", cnpjData.email);
      }

      if (cnpjData.ddd_telefone_1) {
        setValue("telefone", formatTelefone(cnpjData.ddd_telefone_1));
      }

      // Concatenar endereço
      const enderecoPartes = [
        cnpjData.logradouro,
        cnpjData.numero,
        cnpjData.bairro,
        cnpjData.municipio,
        cnpjData.uf
      ].filter(Boolean);

      if (enderecoPartes.length > 0) {
        setValue("endereco", enderecoPartes.join(", "));
      }

      toast.success("Dados da empresa preenchidos automaticamente!");
      
    } catch (error) {
      console.error("Erro ao buscar dados do CNPJ:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao consultar CNPJ");
    } finally {
      setIsFetchingCNPJ(false);
    }
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setValue("cnpj", formatted);

    // Se o CNPJ estiver completo e válido, buscar os dados
    if (isValidCNPJ(formatted)) {
      fetchCNPJData(formatted);
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value);
    setValue("telefone", formatted);
  };

  const onSubmit = async (data: EmpresaFormData) => {
    setIsLoading(true);
    
    try {
      const idUsuario = sessionStorage.getItem('user.uuid');

      console.log('Dados para envio:', data);
      console.log('ID Usuário:', idUsuario);

      if (!idUsuario) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      const empresaData: CreateEmpresaData = {
        nome: data.nome,
        cnpj: data.cnpj,
        email: data.email,
        telefone: data.telefone,
        endereco: data.endereco,
        descricao: data.descricao,
        tipo_simulacao: data.tipo_simulacao,
      };

      console.log('Payload para envio:', empresaData);

      const responseData = await empresaService.createEmpresa(empresaData, idUsuario);
      console.log('Resposta da API:', responseData);
      
      // Verificar se a criação foi bem-sucedida
      if (responseData.code === "201" || responseData.code === 201) {
        toast.success(responseData.mensagem || "Empresa criada com sucesso!");
        
        // Clear form after success
        reset();
        
        // Redirecionar para a tela de listagem de empresas
        navigate("/config_empresa_list");
      } else {
        throw new Error(responseData.mensagem || "Erro ao criar empresa");
      }
      
    } catch (error) {
      console.error("Erro ao salvar empresa:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao criar empresa. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    navigate("/configuracoes");
  };

  const handlePermissionModalClose = () => {
    setShowPermissionModal(false);
    navigate("/index");
  };

  if (isCheckingPermission) {
    return (
      <ConfigLayoutWithSidebar>
        <Card className="w-full max-w-md p-6 shadow-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dotz-laranja mx-auto mb-4"></div>
            <p>Verificando permissões...</p>
          </div>
        </Card>
      </ConfigLayoutWithSidebar>
    );
  }

  return (
    <>
      <ConfigLayoutWithSidebar>
        <div className="space-y-6 w-full max-w-4xl">
          {/* Header Section */}
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
              <h1 className="text-3xl font-bold text-dotz-laranja">Cadastro de Empresa</h1>
            </div>
          </div>

          <Card className="border-dotz-laranja/20 bg-dotz-laranja/5">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-red-600" />
                  <h2 className="text-xl font-semibold text-red-600">Informações da Empresa</h2>
                </div>
                <p className="text-gray-600">
                  Preencha as informações da empresa que será usada no sistema. Esses dados serão utilizados para identificar a origem das interações com o simulador.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full shadow-lg">
            <CardContent className="pt-6">
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
                    <div className="relative">
                      <Input
                        id="cnpj"
                        {...register("cnpj")}
                        placeholder="XX.XXX.XXX/XXXX-XX"
                        onChange={handleCNPJChange}
                        value={watch("cnpj") || ""}
                        className={errors.cnpj ? "border-red-500" : ""}
                      />
                      {isFetchingCNPJ && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-dotz-laranja" />
                        </div>
                      )}
                    </div>
                    {errors.cnpj && (
                      <p className="text-sm text-red-500">{errors.cnpj.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Os dados serão preenchidos automaticamente ao digitar um CNPJ válido
                    </p>
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
                        <SelectItem value="UAT - Versão 1">UAT - Versão 1</SelectItem>
                        <SelectItem value="UAT - Versão 2">UAT - Versão 2</SelectItem>
                      </SelectContent>
                    </Select>
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
        </div>
      </ConfigLayoutWithSidebar>

      <PermissionModal
        isOpen={showPermissionModal}
        onClose={handlePermissionModalClose}
        message={permissionMessage}
      />
    </>
  );
};

export default ConfigEmpresaScreen;
