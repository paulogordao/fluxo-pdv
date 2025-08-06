
import { useState } from "react";
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
import { ArrowLeft, Building2 } from "lucide-react";
import PdvLayout from "@/components/PdvLayout";

const empresaSchema = z.object({
  nome: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(1, "CNPJ é obrigatório").regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX"),
  telefone: z.string().optional(),
  email: z.string().optional().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Email deve ter um formato válido"),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
  tipo_simulacao: z.string().optional(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

const CadastroEmpresaScreen = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

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
      // Simular salvamento (aqui você faria a requisição real para a API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Dados da empresa:", data);
      toast.success("Empresa cadastrada com sucesso!");
      
      // Limpar o formulário após sucesso
      reset();
    } catch (error) {
      console.error("Erro ao salvar empresa:", error);
      toast.error("Erro ao salvar os dados da empresa. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    navigate("/configuracoes");
  };

  return (
    <PdvLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/configuracoes")}
            className="text-gray-600 hover:text-dotz-laranja"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-dotz-laranja" />
            <h1 className="text-3xl font-bold text-dotz-laranja">Cadastro de Empresa</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-dotz-laranja">Informações da Empresa</CardTitle>
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
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  {...register("observacoes")}
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
    </PdvLayout>
  );
};

export default CadastroEmpresaScreen;
