
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
import { toast } from "@/components/ui/sonner";
import { Building2 } from "lucide-react";
import PermissionModal from "@/components/PermissionModal";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";

const empresaSchema = z.object({
  nome: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(1, "CNPJ é obrigatório").regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX"),
  email: z.string().optional().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Email deve ter um formato válido"),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  descricao: z.string().optional(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

const ConfigEmpresaScreen = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

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
    checkUserPermissions();
  }, []);

  const checkUserPermissions = async () => {
    try {
      const userEmail = sessionStorage.getItem("user.login");
      const userUUID = sessionStorage.getItem("user.uuid");
      
      if (!userEmail || !userUUID) {
        setPermissionMessage("Sessão expirada. Faça login novamente.");
        setShowPermissionModal(true);
        setIsCheckingPermission(false);
        return;
      }

      console.log("Verificando permissões para usuário:", userUUID);
      
      const response = await fetch(`https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/permissoes_usuario?id_usuario=${userUUID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975"
        }
      });

      const data = await response.json();
      console.log("Resposta da API de permissões:", data);
      console.log("Tipo dos dados retornados:", typeof data);
      console.log("É um array?", Array.isArray(data));
      
      // Check if user has the required permission
      let hasPermission = false;
      
      // Handle both array and object responses
      if (Array.isArray(data)) {
        // If it's an array of permission objects
        hasPermission = data.some(permissionObj => 
          permissionObj && permissionObj.permissao === "criar_empresa"
        );
        console.log("Verificação em array - possui permissão:", hasPermission);
      } else if (data && typeof data === 'object') {
        // If it's a single object
        hasPermission = data.permissao === "criar_empresa";
        console.log("Verificação em objeto - possui permissão:", hasPermission);
      }
      
      console.log("Resultado final da verificação:", hasPermission);
      
      if (!hasPermission) {
        setPermissionMessage("Você não possui permissão para acessar esta funcionalidade.");
        setShowPermissionModal(true);
      }
      
      setIsCheckingPermission(false);
    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
      setPermissionMessage("Erro ao verificar permissões. Tente novamente.");
      setShowPermissionModal(true);
      setIsCheckingPermission(false);
    }
  };

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

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setValue("cnpj", formatted);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value);
    setValue("telefone", formatted);
  };

  const onSubmit = async (data: EmpresaFormData) => {
    setIsLoading(true);
    
    try {
      // Recuperar dados do sessionStorage
      const apiKey = '0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975';
      const idUsuario = sessionStorage.getItem('user.uuid');

      console.log('Dados para envio:', data);
      console.log('API Key:', apiKey ? 'Configurada' : 'Não encontrada');
      console.log('ID Usuário:', idUsuario);

      if (!idUsuario) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      // Preparar payload
      const payload = {
        nome: data.nome,
        cnpj: data.cnpj,
        email: data.email || null,
        telefone: data.telefone || null,
        endereco: data.endereco || null,
        descricao: data.descricao || null,
      };

      console.log('Payload para envio:', payload);

      // Fazer requisição POST
      const response = await fetch('https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/empresas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'id_usuario': idUsuario,
        },
        body: JSON.stringify(payload),
      });

      console.log('Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Erro da API:', errorText);
        throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
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
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-3 text-2xl text-dotz-laranja">
              <Building2 className="h-8 w-8" />
              <span>Cadastro de Empresa</span>
            </CardTitle>
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
                    onChange={handleCNPJChange}
                    value={watch("cnpj") || ""}
                    className={errors.cnpj ? "border-red-500" : ""}
                  />
                  {errors.cnpj && (
                    <p className="text-sm text-red-500">{errors.cnpj.message}</p>
                  )}
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

export default ConfigEmpresaScreen;
