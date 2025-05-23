
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";

const LoginScreen = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    if (!username || !password) {
      setShowError(true);
      return;
    }
    
    // Hide error if previously shown
    setShowError(false);
    
    // Save user session data
    sessionStorage.setItem("user.login", username);
    sessionStorage.setItem("user.senha", password);
    
    // Display success toast
    toast.success("Login realizado com sucesso");
    
    // Navigate to main page
    navigate("/welcome");
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
                  Preencha usuário e senha para continuar.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
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
              />
            </div>
            
            <Button type="submit" size="full" variant="dotz" className="mt-6">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-4 text-center text-gray-500 text-sm">Simulador PDV - Guia Técnico de Integração</div>
    </div>
  );
};

export default LoginScreen;
