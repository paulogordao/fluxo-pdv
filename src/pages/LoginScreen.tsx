
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";

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
  const [accessRequestData, setAccessRequestData] = useState({
    nome_empresa: "",
    cnpj: "",
    email: "",
    nome: ""
  });
  const [requestSuccess, setRequestSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCNPJ = (cnpj: string) => {
    // Basic CNPJ validation - just check if it has 14 digits
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.length === 14;
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
      const response = await fetch("https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/usuarios/solicitar_acesso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975"
        },
        body: JSON.stringify(accessRequestData)
      });

      const data = await response.json();

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
      console.error("Erro ao enviar solicitação de acesso:", error);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmittingRequest(false);
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
      const response = await fetch("https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/validaUsuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975"
        },
        body: JSON.stringify({
          email: email,
          senha: password
        })
      });

      const data = await response.json();

      if (data.mensagem === "senha correta" && data.code === 200) {
        // Save user session data
        sessionStorage.setItem("user.login", email);
        sessionStorage.setItem("user.senha", password);
        
        // Save user ID in multiple places to ensure the permissions hook can find it
        if (data.id_usuario) {
          console.log('Saving user ID for permissions:', data.id_usuario);
          // Save in sessionStorage (existing)
          sessionStorage.setItem("user.uuid", data.id_usuario);
          // Save in localStorage with direct key that useUserPermissions looks for
          localStorage.setItem("userId", data.id_usuario);
          // Also save the full login response for backup
          localStorage.setItem("loginResponse", JSON.stringify(data));
          // Save user data object
          localStorage.setItem("userData", JSON.stringify({ id_usuario: data.id_usuario }));
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
      console.error("Erro na autenticação:", error);
      setErrorMessage("Erro de conexão. Tente novamente.");
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
                      <Input
                        id="cnpj"
                        value={accessRequestData.cnpj}
                        onChange={(e) => setAccessRequestData(prev => ({
                          ...prev,
                          cnpj: e.target.value
                        }))}
                        placeholder="Digite o CNPJ (14 dígitos)"
                        disabled={isSubmittingRequest}
                      />
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
