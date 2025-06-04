
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";
import { authService } from "@/services/authService";

const PrimeiroAcessoScreen = () => {
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push("A senha deve conter pelo menos 8 caracteres");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("A senha deve conter pelo menos uma letra minúscula");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("A senha deve conter pelo menos uma letra maiúscula");
    }
    
    if (!/\d/.test(password)) {
      errors.push("A senha deve conter pelo menos um número");
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors([]);
    
    // Validate password requirements
    const passwordErrors = validatePassword(novaSenha);
    
    // Check if passwords match
    if (novaSenha !== confirmarSenha) {
      passwordErrors.push("As senhas não coincidem");
    }
    
    if (passwordErrors.length > 0) {
      setErrors(passwordErrors);
      return;
    }
    
    // Get user ID from session
    const userId = sessionStorage.getItem("primeiro_acesso_user_id");
    if (!userId) {
      toast.error("Sessão expirada. Faça login novamente.");
      navigate("/login");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const data = await authService.resetPassword(userId, novaSenha);

      if (data.status === "ok" && data.code === 200) {
        // Clear first access user ID from session
        sessionStorage.removeItem("primeiro_acesso_user_id");
        
        // Show success message
        toast.success("Senha redefinida com sucesso");
        
        // Navigate back to login with success message
        navigate("/login");
        
        // Show additional toast after navigation
        setTimeout(() => {
          toast.success("Senha redefinida com sucesso. Faça login com sua nova senha.");
        }, 100);
      } else {
        toast.error("Erro ao redefinir senha. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      toast.error(error instanceof Error ? error.message : "Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = novaSenha && confirmarSenha && errors.length === 0 && novaSenha === confirmarSenha;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-dotz-laranja">
            Definir Nova Senha
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Este é seu primeiro acesso. Por favor, defina uma senha segura.
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <Input
                id="novaSenha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite sua nova senha"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme sua nova senha"
                disabled={isLoading}
              />
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium">Sua senha deve conter:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Pelo menos 8 caracteres</li>
                <li>Letras maiúsculas e minúsculas</li>
                <li>Pelo menos um número</li>
              </ul>
            </div>
            
            <Button 
              type="submit" 
              size="full" 
              variant="dotz" 
              className="mt-6"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? "Definindo..." : "Definir nova senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-4 text-center text-gray-500 text-sm">
        Simulador PDV - Primeiro Acesso
      </div>
    </div>
  );
};

export default PrimeiroAcessoScreen;
