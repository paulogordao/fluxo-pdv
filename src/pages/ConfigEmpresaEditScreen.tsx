
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
import { toast } from "@/components/ui/sonner";
import { Building2, ArrowLeft } from "lucide-react";
import PermissionModal from "@/components/PermissionModal";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";

const empresaEditSchema = z.object({
  nome: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(1, "CNPJ é obrigatório"),
  email: z.string().optional().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Email deve ter um formato válido"),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  descricao: z.string().optional(),
});

type EmpresaEditFormData = z.infer<typeof empresaEditSchema>;

interface EmpresaData {
  id: string;
  created_at: string;
  nome: string;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  endereco: string;
  descricao: string | null;
}

const ConfigEmpresaEditScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);

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

  // Load empresa data on component mount
  useEffect(() => {
    if (id) {
      fetchEmpresaData(id);
    } else {
      navigate("/config_empresa_list");
    }
  }, [id, navigate]);

  const fetchEmpresaData = async (empresaId: string) => {
    try {
      setIsLoadingData(true);
      
      const userEmail = sessionStorage.getItem("user.login");
      const userUUID = sessionStorage.getItem("user.uuid");
      const apiKey = '0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975';
      
      if (!userEmail || !userUUID) {
        setPermissionMessage("Sessão expirada. Faça login novamente.");
        setShowPermissionModal(true);
        return;
      }

      console.log("Buscando dados da empresa:", empresaId);
      
      const response = await fetch(`https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/empresas?id=${empresaId}`, {
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

      const data: EmpresaData = await response.json();
      console.log("Dados da empresa recebidos:", data);
      
      setEmpresaData(data);
      
      // Preencher o formulário com os dados recebidos
      setValue("nome", data.nome);
      setValue("cnpj", data.cnpj);
      setValue("email", data.email || "");
      setValue("telefone", data.telefone || "");
      setValue("endereco", data.endereco || "");
      setValue("descricao", data.descricao || "");
      
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
    // Funcionalidade de salvar será implementada posteriormente
    console.log("Dados para salvar:", data);
    toast.success("Funcionalidade de salvar será implementada em breve!");
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
