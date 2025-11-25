import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { authService } from "@/services/authService";
import { brasilApiService } from "@/services/brasilApiService";
import { userService } from "@/services/userService";
import { empresaService } from "@/services/empresaService";
import { createLogger } from '@/utils/logger';

const log = createLogger('LoginScreen');

const LoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // States for access request modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isFetchingCNPJ, setIsFetchingCNPJ] = useState(false);
  const [accessRequestData, setAccessRequestData] = useState({
    nome_empresa: "",
    cnpj: "",
    email: "",
    nome: ""
  });
  const [requestSuccess, setRequestSuccess] = useState(false);

  // States for forgot password modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCNPJ = (cnpj: string) => {
    // Basic CNPJ validation - just check if it has 14 digits
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.length === 14;
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

  const fetchCNPJData = async (cnpj: string) => {
    if (!validateCNPJ(cnpj)) return;

    setIsFetchingCNPJ(true);
    
    try {
      log.debug('Buscando dados do CNPJ:', cnpj);
      const cnpjData = await brasilApiService.consultarCNPJ(cnpj);
      log.debug('Dados recebidos da API:', cnpjData);

      // Only fill empty fields to avoid overwriting user input
      setAccessRequestData(prev => ({
        ...prev,
        nome_empresa: prev.nome_empresa || cnpjData.razao_social || "",
        email: prev.email || cnpjData.email || "",
      }));

      toast.success("Dados da empresa preenchidos automaticamente!");
      
    } catch (error) {
      log.error("Erro ao buscar dados do CNPJ:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao consultar CNPJ");
    } finally {
      setIsFetchingCNPJ(false);
    }
  };

  const handleCNPJChange = (value: string) => {
    const formatted = formatCNPJ(value);
    setAccessRequestData(prev => ({
      ...prev,
      cnpj: formatted
    }));

    // If CNPJ is complete and valid, fetch data
    if (validateCNPJ(formatted)) {
      fetchCNPJData(formatted);
    }
  };

  const handleForgotPassword = async () => {
    // Validate email format
    if (!forgotPasswordEmail) {
      toast.error("Digite um email para continuar");
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      toast.error("Digite um email válido");
      return;
    }

    setIsSubmittingForgotPassword(true);

    try {
      const data = await authService.forgotPassword(forgotPasswordEmail);

      if (data.status === "ok" && data.code === 200) {
        toast.success("Se o e-mail existir no sistema, você receberá uma senha temporária com instruções para redefinir sua senha.");
        setForgotPasswordEmail("");
        setIsForgotPasswordOpen(false);
      } else {
        toast.error("Erro ao enviar solicitação. Tente novamente.");
      }
    } catch (error) {
      log.error("Erro ao enviar solicitação de recuperação:", error);
      toast.error(error instanceof Error ? error.message : "Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmittingForgotPassword(false);
    }
  };

  const handleAccessRequest = async () => {
    // Validate required fields
    if (!accessRequestData.nome_empresa || !accessRequestData.cnpj || !accessRequestData.email || !accessRequestData.nome) {
      toast.error("Todos os campos são obrigatórios");
      return;
    }

    // Validate email format
    if (!validateEmail(accessRequestData.email)) {
      toast.error("Digite um email válido");
      return;
    }

    // Validate CNPJ format
    if (!validateCNPJ(accessRequestData.cnpj)) {
      toast.error("Digite um CNPJ válido (14 dígitos)");
      return;
    }

    setIsSubmittingRequest(true);

    try {
      const data = await authService.requestAccess(accessRequestData);

      if (data.status === "ok") {
        setRequestSuccess(true);
        // Clear form data
        setAccessRequestData({
          nome_empresa: "",
          cnpj: "",
          email: "",
          nome: ""
        });
      } else {
        toast.error("Erro ao enviar solicitação. Tente novamente.");
      }
    } catch (error) {
      log.error("Erro ao enviar solicitação de acesso:", error);
      toast.error(error instanceof Error ? error.message : "Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const cacheUserSessionData = async (userId: string) => {
    try {
      log.debug('Caching user session data for userId:', userId);
      
      // 1. Fetch user data
      const userData = await userService.getUserById(userId, userId);
      const userName = userData.nome || "Usuário";
      const empresaId = userData.empresa_id;
      
      let companyName = userData.empresa || "Empresa";
      let tipoSimulacao = null;
      
      // 2. Fetch company data if available
      if (empresaId) {
        try {
          const empresaData = await empresaService.getEmpresaById(empresaId, userId);
          companyName = empresaData.nome || companyName;
          tipoSimulacao = empresaData.tipo_simulacao || null;
        } catch (error) {
          log.warn('Error fetching company data:', error);
        }
      }
      
      // 3. Create cache object with timestamp
      const cacheData = {
        userName,
        companyName,
        userId,
        tipo_simulacao: tipoSimulacao,
        timestamp: Date.now(),
        expires_in: 60 * 60 * 1000 // 1 hour in milliseconds
      };
      
      // 4. Save to storage
      localStorage.setItem("user_session_cache", JSON.stringify(cacheData));
      sessionStorage.setItem("user_name", userName);
      sessionStorage.setItem("company_name", companyName);
      
      log.debug('User session data cached successfully:', cacheData);
      
    } catch (error) {
      log.error('Error caching user session data:', error);
      // Don't throw error to avoid breaking login flow
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRequestSuccess(false);
    if (!requestSuccess) {
      // Only clear form if not successful (to avoid clearing success message)
      setAccessRequestData({
        nome_empresa: "",
        cnpj: "",
        email: "",
        nome: ""
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    if (!email || !password) {
      setErrorMessage("Preencha email e senha para continuar.");
      setShowError(true);
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setErrorMessage("Digite um email válido.");
      setShowError(true);
      return;
    }
    
    // Hide error if previously shown
    setShowError(false);
    setIsLoading(true);

    try {
      const data = await authService.validateUser(email, password);

      if (data.mensagem === "senha correta" && data.code === 200) {
        // Save user session data
        sessionStorage.setItem("user.login", email);
        // Security: Removed password storage from sessionStorage
        
        // Save user ID in multiple places to ensure the permissions hook can find it
        if (data.id_usuario) {
          log.debug('Saving user ID for permissions:', data.id_usuario);
          // Save in sessionStorage (existing)
          sessionStorage.setItem("user.uuid", data.id_usuario);
          // Save in localStorage with direct key that useUserPermissions looks for
          localStorage.setItem("userId", data.id_usuario);
          // Also save the full login response for backup
          localStorage.setItem("loginResponse", JSON.stringify(data));
          // Save user data object
          localStorage.setItem("userData", JSON.stringify({ id_usuario: data.id_usuario }));
          
          // Check if this is first access
          if (data.primeiro_acesso === true) {
            // Store user ID for password reset page
            sessionStorage.setItem("primeiro_acesso_user_id", data.id_usuario);
            // Navigate to first access password setup
            navigate("/primeiro_acesso");
            return;
          }
          
          // Fetch and cache user session data
          await cacheUserSessionData(data.id_usuario);
        }
        
        // Display success toast
        toast.success("Login realizado com sucesso");
        
        // Navigate to index page
        navigate("/index");
      } else {
        setErrorMessage("Email ou senha inválidos. Tente novamente.");
        setShowError(true);
      }
    } catch (error) {
      log.error("Erro na autenticação:", error);
      setErrorMessage(error instanceof Error ? error.message : "Erro de conexão. Tente novamente.");
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-dotz-laranja">Login do Simulador de PDV</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {showError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              size="full" 
              variant="dotz" 
              className="mt-6"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Forgot Password Button */}
          <div className="mt-4">
            <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="full" 
                  className="w-full text-gray-600 hover:text-gray-800"
                  onClick={() => setIsForgotPasswordOpen(true)}
                >
                  Esqueci minha senha
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Recuperar senha</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot_email">E-mail</Label>
                    <Input
                      id="forgot_email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="Digite seu e-mail"
                      disabled={isSubmittingForgotPassword}
                    />
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      variant="cancel" 
                      onClick={() => {
                        setIsForgotPasswordOpen(false);
                        setForgotPasswordEmail("");
                      }}
                      disabled={isSubmittingForgotPassword}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleForgotPassword}
                      disabled={isSubmittingForgotPassword}
                      variant="dotz"
                      className="flex-1"
                    >
                      {isSubmittingForgotPassword ? "Enviando..." : "Recuperar senha"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Access Request Button */}
          <div className="mt-4">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="full" 
                  className="w-full"
                  onClick={() => setIsModalOpen(true)}
                >
                  Solicitar acesso
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Solicitar acesso ao sistema</DialogTitle>
                </DialogHeader>
                
                {requestSuccess ? (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <div className="text-green-600 text-lg font-semibold mb-2">
                        ✅ Dados recebidos com sucesso!
                      </div>
                      <p className="text-gray-600">
                        Após aprovação, orientações sobre os próximos passos serão enviadas para o e-mail informado.
                      </p>
                    </div>
                    <Button 
                      onClick={handleCloseModal} 
                      className="w-full"
                      variant="dotz"
                    >
                      Fechar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome_empresa">Nome da empresa *</Label>
                      <Input
                        id="nome_empresa"
                        value={accessRequestData.nome_empresa}
                        onChange={(e) => setAccessRequestData(prev => ({
                          ...prev,
                          nome_empresa: e.target.value
                        }))}
                        placeholder="Digite o nome da empresa"
                        disabled={isSubmittingRequest}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <div className="relative">
                        <Input
                          id="cnpj"
                          value={accessRequestData.cnpj}
                          onChange={(e) => handleCNPJChange(e.target.value)}
                          placeholder="XX.XXX.XXX/XXXX-XX"
                          disabled={isSubmittingRequest}
                        />
                        {isFetchingCNPJ && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-dotz-laranja" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Os dados serão preenchidos automaticamente ao digitar um CNPJ válido
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="request_email">E-mail de contato *</Label>
                      <Input
                        id="request_email"
                        type="email"
                        value={accessRequestData.email}
                        onChange={(e) => setAccessRequestData(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        placeholder="Digite o e-mail de contato"
                        disabled={isSubmittingRequest}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome do solicitante *</Label>
                      <Input
                        id="nome"
                        value={accessRequestData.nome}
                        onChange={(e) => setAccessRequestData(prev => ({
                          ...prev,
                          nome: e.target.value
                        }))}
                        placeholder="Digite seu nome"
                        disabled={isSubmittingRequest}
                      />
                    </div>
                    
                    <div className="flex space-x-2 pt-4">
                      <Button 
                        variant="cancel" 
                        onClick={handleCloseModal}
                        disabled={isSubmittingRequest}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleAccessRequest}
                        disabled={isSubmittingRequest}
                        variant="dotz"
                        className="flex-1"
                      >
                        {isSubmittingRequest ? "Enviando..." : "Salvar"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-4 text-center text-gray-500 text-sm">Simulador PDV - Guia Técnico de Integração</div>
    </div>
  );
};

export default LoginScreen;
