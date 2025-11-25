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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Eye, EyeOff, Key, Calendar, Shield, RefreshCw, CircleDot, AlertCircle } from "lucide-react";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";
import { credentialsService, CredentialData, CredentialListItem } from "@/services/credentialsService";
import { formatCNPJInput, normalizeCNPJ } from "@/utils/cnpjUtils";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import PermissionModal from "@/components/PermissionModal";
import { extractErrorMessage, formatHealthCheckError } from '@/utils/errorUtils';
import { createLogger } from '@/utils/logger';

const log = createLogger('ConfigCredenciaisScreen');

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
  const { hasPermission } = useUserPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showPfxPassword, setShowPfxPassword] = useState(false);
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [updatingCredentials, setUpdatingCredentials] = useState<Set<string>>(new Set());
  const [cnpjValue, setCnpjValue] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");
  const [healthCheckingCredentials, setHealthCheckingCredentials] = useState<Set<string>>(new Set());
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedErrorDetails, setSelectedErrorDetails] = useState<any>(null);

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
      const credentialsWithHealthStatus = (Array.isArray(credentialsData) ? credentialsData : []).map(cred => ({
        ...cred,
        healthStatus: 'not-checked' as const
      }));
      setCredentials(credentialsWithHealthStatus);
    } catch (error) {
      log.error("Erro ao carregar credenciais:", error);
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

    // Check permission for production environment
    if (data.ambiente === "prod" && !hasPermission("criar_credencial_producao")) {
      setPermissionMessage("Credenciais para ambientes produtivos só podem ser criados por usuários ROOT, procure o administrador!");
      setShowPermissionModal(true);
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

      log.error('Error updating credential status:', error);
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

  const handleHealthCheck = async (partnerId: string) => {
    // Add to health checking set
    setHealthCheckingCredentials(prev => new Set(prev).add(partnerId));
    
    // Update credential status to loading
    setCredentials(prev => 
      prev.map(cred => 
        cred.partner_id === partnerId 
          ? { ...cred, healthStatus: 'loading', healthError: null }
          : cred
      )
    );

    try {
      const healthResponse = await credentialsService.checkCredentialHealth(partnerId);
      const isHealthy = healthResponse.status === 200;
      
      // Update credential status based on response
      setCredentials(prev => 
        prev.map(cred => 
          cred.partner_id === partnerId 
            ? { 
                ...cred, 
                healthStatus: isHealthy ? 'healthy' : 'unhealthy',
                healthError: isHealthy ? null : {
                  response: healthResponse,
                  timestamp: new Date().toISOString(),
                  message: 'Health check failed',
                  partnerId: partnerId
                }
              }
            : cred
        )
      );

      toast({
        title: "Health check concluído",
        description: `Credencial está ${isHealthy ? 'funcionando' : 'com problemas'}`,
        variant: isHealthy ? "default" : "destructive",
      });
    } catch (error) {
      // Capture error details
      const errorDetails = {
        error: extractErrorMessage(error),
        originalError: error,
        timestamp: new Date().toISOString(),
        type: 'network_error',
        partnerId: partnerId
      };

      // Update credential status to unhealthy on error
      setCredentials(prev => 
        prev.map(cred => 
          cred.partner_id === partnerId 
            ? { 
                ...cred, 
                healthStatus: 'unhealthy',
                healthError: errorDetails
              }
            : cred
        )
      );

      log.error('Error checking credential health:', error);
      toast({
        title: "Erro na verificação",
        description: extractErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      // Remove from health checking set
      setHealthCheckingCredentials(prev => {
        const newSet = new Set(prev);
        newSet.delete(partnerId);
        return newSet;
      });
    }
  };

  const handleRefreshAllHealthChecks = async () => {
    const activeCredentials = credentials.filter(cred => cred.enabled);
    
    for (const credential of activeCredentials) {
      // Add delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
      handleHealthCheck(credential.partner_id);
    }
  };

  const getHealthStatusIcon = (credential: CredentialListItem) => {
    if (!credential.enabled) {
      return (
        <div className="flex items-center justify-center">
          <CircleDot className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    }

    switch (credential.healthStatus) {
      case 'loading':
        return (
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          </div>
        );
      case 'healthy':
        return (
          <div className="flex items-center justify-center">
            <CircleDot className="h-4 w-4 text-green-500 fill-green-500" />
          </div>
        );
      case 'unhealthy':
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                setSelectedErrorDetails(credential.healthError);
                setShowErrorModal(true);
              }}
              className="p-1 hover:bg-muted rounded-md transition-colors"
              title="Clique para ver detalhes do erro"
            >
              <AlertCircle className="h-4 w-4 text-red-500 cursor-pointer hover:text-red-600" />
            </button>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => handleHealthCheck(credential.partner_id)}
              disabled={healthCheckingCredentials.has(credential.partner_id)}
              className="p-1 hover:bg-muted rounded-md transition-colors"
              title="Verificar health check"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </button>
          </div>
        );
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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Credenciais Cadastradas</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAllHealthChecks}
                disabled={credentials.filter(cred => cred.enabled).length === 0}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Verificar Todas</span>
              </Button>
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
                        <TableHead className="text-center">Health Check</TableHead>
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
                        <TableCell className="text-center">
                          {getHealthStatusIcon(credential)}
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

      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        message={permissionMessage}
      />

      {/* Error Details Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Detalhes do Erro - Health Check</span>
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre o erro ocorrido durante a verificação da credencial.
            </DialogDescription>
          </DialogHeader>
          
          {selectedErrorDetails && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Prominent Error Message */}
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <Label className="text-sm font-semibold text-destructive">Erro Específico</Label>
                <p className="text-sm font-medium text-destructive mt-2">
                  {selectedErrorDetails.type === 'network_error' 
                    ? selectedErrorDetails.error 
                    : formatHealthCheckError(selectedErrorDetails)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Timestamp</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(selectedErrorDetails.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>

              {selectedErrorDetails.type === 'network_error' ? (
                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Erro de Conexão/Rede
                  </p>
                </div>
              ) : (
                <>
                  {selectedErrorDetails.response && (
                    <div>
                      <Label className="text-sm font-medium">Status Code</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedErrorDetails.response.status_code}
                      </p>
                    </div>
                  )}

                  {selectedErrorDetails.response?.url && (
                    <div>
                      <Label className="text-sm font-medium">URL</Label>
                      <p className="text-sm text-muted-foreground mt-1 break-all">
                        {selectedErrorDetails.response.url}
                      </p>
                    </div>
                  )}

                  {selectedErrorDetails.response?.response && (
                    <div>
                      <Label className="text-sm font-medium">Resposta Completa da API</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md">
                        <pre className="text-xs text-muted-foreground overflow-x-auto">
                          {JSON.stringify(selectedErrorDetails.response.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Debug Information */}
              {selectedErrorDetails.originalError && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Informações de Debug
                  </summary>
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <pre className="overflow-x-auto">
                      {JSON.stringify(selectedErrorDetails.originalError, null, 2)}
                    </pre>
                  </div>
                </details>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowErrorModal(false)}>
                  Fechar
                </Button>
                {selectedErrorDetails.partnerId && (
                  <Button 
                    onClick={() => {
                      setShowErrorModal(false);
                      handleHealthCheck(selectedErrorDetails.partnerId);
                    }}
                  >
                    Tentar Novamente
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ConfigLayoutWithSidebar>
  );
};

export default ConfigCredenciaisScreen;