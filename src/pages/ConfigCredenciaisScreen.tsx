import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Eye, EyeOff, Key } from "lucide-react";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";
import { credentialsService, CredentialData } from "@/services/credentialsService";

const credentialSchema = z.object({
  cnpj: z.string().min(14, "CNPJ é obrigatório e deve ter pelo menos 14 caracteres"),
  client_id: z.string().min(1, "Client ID é obrigatório"),
  client_secret: z.string().min(1, "Client Secret é obrigatório"),
  pfx_password: z.string().min(1, "Senha PFX é obrigatória"),
  pfx_file: z.string().min(1, "Arquivo PFX é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
});

type FormData = z.infer<typeof credentialSchema>;

const ConfigCredenciaisScreen = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showPfxPassword, setShowPfxPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(credentialSchema),
  });

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:application/x-pkcs12;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.pfx')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione apenas arquivos .pfx",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setSelectedFile(file);
      setValue('pfx_file', base64);
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: "Não foi possível converter o arquivo para Base64",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedFile) {
      toast({
        title: "Arquivo necessário",
        description: "Por favor, selecione um arquivo PFX",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await credentialsService.createCredential(data as CredentialData);
      
      toast({
        title: "Credencial criada com sucesso",
        description: "A credencial MTLS foi cadastrada no sistema",
        variant: "default",
      });

      // Reset form
      reset();
      setSelectedFile(null);
    } catch (error) {
      console.error('Error creating credential:', error);
      toast({
        title: "Erro ao criar credencial",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfigLayoutWithSidebar>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary rounded-lg">
            <Key className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Credenciais MTLS</h1>
            <p className="text-muted-foreground">
              Cadastre as credenciais para autenticação mútua TLS
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nova Credencial</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    {...register("cnpj")}
                    placeholder="00.000.000/0000-00"
                    className={errors.cnpj ? "border-destructive" : ""}
                  />
                  {errors.cnpj && (
                    <p className="text-sm text-destructive">{errors.cnpj.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_id">Client ID *</Label>
                  <Input
                    id="client_id"
                    {...register("client_id")}
                    placeholder="Digite o Client ID"
                    className={errors.client_id ? "border-destructive" : ""}
                  />
                  {errors.client_id && (
                    <p className="text-sm text-destructive">{errors.client_id.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_secret">Client Secret *</Label>
                <div className="relative">
                  <Input
                    id="client_secret"
                    type={showClientSecret ? "text" : "password"}
                    {...register("client_secret")}
                    placeholder="Digite o Client Secret"
                    className={errors.client_secret ? "border-destructive pr-10" : "pr-10"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowClientSecret(!showClientSecret)}
                  >
                    {showClientSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.client_secret && (
                  <p className="text-sm text-destructive">{errors.client_secret.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pfx_password">Senha PFX *</Label>
                <div className="relative">
                  <Input
                    id="pfx_password"
                    type={showPfxPassword ? "text" : "password"}
                    {...register("pfx_password")}
                    placeholder="Digite a senha do arquivo PFX"
                    className={errors.pfx_password ? "border-destructive pr-10" : "pr-10"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPfxPassword(!showPfxPassword)}
                  >
                    {showPfxPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.pfx_password && (
                  <p className="text-sm text-destructive">{errors.pfx_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pfx_file">Arquivo PFX *</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="pfx_file"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Clique para enviar</span> ou arraste o arquivo
                        </p>
                        <p className="text-xs text-muted-foreground">Apenas arquivos .pfx</p>
                      </div>
                      <input
                        id="pfx_file"
                        type="file"
                        className="hidden"
                        accept=".pfx"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  {selectedFile && (
                    <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                  {errors.pfx_file && (
                    <p className="text-sm text-destructive">{errors.pfx_file.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Descreva esta credencial (ex: Ambiente de produção - Loja ABC)"
                  rows={3}
                  className={errors.description ? "border-destructive" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setSelectedFile(null);
                  }}
                  disabled={isLoading}
                >
                  Limpar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Credencial'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ConfigLayoutWithSidebar>
  );
};

export default ConfigCredenciaisScreen;