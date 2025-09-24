import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Eye, EyeOff, Key, Calendar, Shield } from "lucide-react";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";
import { credentialsService, CredentialData, CredentialListItem } from "@/services/credentialsService";
import { formatCNPJInput, normalizeCNPJ } from "@/utils/cnpjUtils";

const credentialSchema = z.object({
  cnpj: z.string().min(14, "CNPJ é obrigatório e deve ter pelo menos 14 caracteres"),
  client_id: z.string().min(1, "Client ID é obrigatório"),
  client_secret: z.string().min(1, "Client Secret é obrigatório"),
  pfx_password: z.string().min(1, "Senha PFX é obrigatória"),
  pfx_file: z.string().min(1, "Arquivo PFX é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  ambiente: z.enum(["prod", "uat"], { required_error: "Ambiente é obrigatório" }),
});

type FormData = z.infer<typeof credentialSchema>;

const ConfigCredenciaisScreen = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showPfxPassword, setShowPfxPassword] = useState(false);
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [updatingCredentials, setUpdatingCredentials] = useState<Set<string>>(new Set());
  const [cnpjValue, setCnpjValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(credentialSchema),
  });

  // Load credentials when component mounts
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    setIsLoadingCredentials(true);
    try {
      const credentialsData = await credentialsService.getCredentials();
      setCredentials(Array.isArray(credentialsData) ? credentialsData : []);
    } catch (error) {
      console.error("Erro ao carregar credenciais:", error);
      setCredentials([]); // Ensure we always have an array
      toast({
        title: "Erro ao carregar credenciais",
        description: "Não foi possível carregar a lista de credenciais",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCredentials(false);
    }
  };

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
      // Normalize CNPJ before sending to API (remove formatting)
      const normalizedData = {
        ...data,
        cnpj: normalizeCNPJ(data.cnpj)
      };
      await credentialsService.createCredential(normalizedData as CredentialData);
      
      toast({
        title: "Credencial criada com sucesso",
        description: "A credencial MTLS foi cadastrada no sistema",
        variant: "default",
      });

      // Reset form and reload credentials
      reset();
      setSelectedFile(null);
      setCnpjValue("");
      loadCredentials();
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

  const handleToggleCredential = async (partnerId: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    
    // Optimistic update
    setCredentials(prev => 
      prev.map(cred => 
        cred.partner_id === partnerId 
          ? { ...cred, enabled: newEnabled }
          : cred
      )
    );

    // Add to updating set
    setUpdatingCredentials(prev => new Set(prev).add(partnerId));

    try {
      await credentialsService.updateCredentialStatus(partnerId, newEnabled);
      
      toast({
        title: "Status atualizado",
        description: `Credencial ${newEnabled ? 'ativada' : 'desativada'} com sucesso`,
        variant: "default",
      });
    } catch (error) {
      // Revert optimistic update on error
      setCredentials(prev => 
        prev.map(cred => 
          cred.partner_id === partnerId 
            ? { ...cred, enabled: currentEnabled }
            : cred
        )
      );

      console.error('Error updating credential status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      // Remove from updating set
      setUpdatingCredentials(prev => {
        const newSet = new Set(prev);
        newSet.delete(partnerId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Data não disponível";
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return "Data inválida";
    }
  };

  const formatAmbiente = (ambiente?: string) => {
    switch(ambiente) {
      case 'uat': return 'Homologação';
      case 'prod': return 'Produção';
      default: return 'N/A';
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

        {/* Credentials List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Credenciais Cadastradas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCredentials ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Carregando credenciais...</span>
              </div>
            ) : credentials.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma credencial cadastrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="hidden sm:table-cell">Ambiente</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Data de Atualização
                      </TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credentials.map((credential) => (
                      <TableRow key={credential.partner_id}>
                        <TableCell className="font-medium">
                          {credential.description}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            credential.ambiente === 'prod' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          }`}>
                            {formatAmbiente(credential.ambiente)}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {formatDate(credential.updated_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Switch
                              checked={credential.enabled}
                              disabled={updatingCredentials.has(credential.partner_id)}
                              onCheckedChange={() => handleToggleCredential(credential.partner_id, credential.enabled)}
                            />
                            {updatingCredentials.has(credential.partner_id) && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            <span className={`text-xs font-medium ${
                              credential.enabled ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {credential.enabled ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create New Credential Form */}
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
                    value={cnpjValue}
                    onChange={(e) => {
                      const formatted = formatCNPJInput(e.target.value);
                      setCnpjValue(formatted);
                      setValue("cnpj", formatted);
                    }}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className={errors.cnpj ? "border-destructive" : ""}
                  />
                  {errors.cnpj && (
                    <p className="text-sm text-destructive">{errors.cnpj.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ambiente">Ambiente *</Label>
                  <Select onValueChange={(value) => setValue("ambiente", value as "prod" | "uat")}>
                    <SelectTrigger className={errors.ambiente ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione o ambiente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prod">Produção</SelectItem>
                      <SelectItem value="uat">Homologação</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.ambiente && (
                    <p className="text-sm text-destructive">{errors.ambiente.message}</p>
                  )}
                </div>
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
                    setCnpjValue("");
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