
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";
import { Settings } from "lucide-react";

const LoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
        
        // Display success toast
        toast.success("Login realizado com sucesso");
        
        // Navigate to main page
        navigate("/welcome");
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
      {/* Settings Icon - repositioned to top left and larger */}
      <div className="absolute top-6 left-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/config_empresa")}
          className="text-gray-600 hover:text-dotz-laranja h-12 w-12"
          title="Configurações"
        >
          <Settings className="h-8 w-8" />
        </Button>
      </div>

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
        </CardContent>
      </Card>
      
      <div className="mt-4 text-center text-gray-500 text-sm">Simulador PDV - Guia Técnico de Integração</div>
    </div>
  );
};

export default LoginScreen;
