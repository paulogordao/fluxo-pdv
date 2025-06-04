
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { testUserService, UsuarioTeste } from "@/services/testUserService";
import { useUserSession } from "@/hooks/useUserSession";

interface TestUsersSidebarProps {
  onCpfSelect: (cpf: string) => void;
}

const TestUsersSidebar = ({ onCpfSelect }: TestUsersSidebarProps) => {
  const [testUsers, setTestUsers] = useState<UsuarioTeste[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { userId } = useUserSession();

  useEffect(() => {
    const loadTestUsers = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const users = await testUserService.getUsuariosTeste(userId);
        setTestUsers(users);
      } catch (error) {
        console.error("Erro ao carregar usuários de teste:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTestUsers();
  }, [userId]);

  const formatCPF = (cpf: string | number) => {
    // Convert to string first to handle both string and number inputs
    const cpfString = String(cpf);
    const cleaned = cpfString.replace(/\D/g, "");
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const handleCpfClick = (cpf: string | number) => {
    // Convert to string and clean it
    const cleanedCpf = String(cpf).replace(/\D/g, "");
    onCpfSelect(cleanedCpf);
  };

  if (isCollapsed) {
    return (
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-20">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="bg-white shadow-lg"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg z-10 overflow-y-auto">
      <Card className="h-full rounded-none border-r">
        <CardHeader className="pb-4 mt-24">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-dotz-laranja" />
              CPFs de Teste
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">
              Carregando...
            </div>
          ) : testUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              Nenhum CPF de teste cadastrado
            </div>
          ) : (
            testUsers.map((user, index) => (
              <Card key={index} className="border border-gray-200 hover:border-dotz-laranja transition-colors">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="font-mono text-lg font-semibold text-gray-800">
                      {formatCPF(user.identificacao_usuario)}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {user.pedir_telefone && (
                        <Badge variant="secondary" className="text-xs">
                          Telefone ✅
                        </Badge>
                      )}
                      {user.possui_dotz && (
                        <Badge variant="secondary" className="text-xs">
                          Dotz ✅
                        </Badge>
                      )}
                      {user.outros_meios_pagamento && (
                        <Badge variant="secondary" className="text-xs">
                          Outros Pagamentos ✅
                        </Badge>
                      )}
                      {user.dotz_sem_app && (
                        <Badge variant="secondary" className="text-xs">
                          Dotz sem App ✅
                        </Badge>
                      )}
                      {user.permitir_pagamento_token && (
                        <Badge variant="secondary" className="text-xs">
                          Token ✅
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      className="w-full bg-dotz-laranja hover:bg-dotz-laranja/90 text-white"
                      onClick={() => handleCpfClick(user.identificacao_usuario)}
                    >
                      Usar este CPF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestUsersSidebar;
