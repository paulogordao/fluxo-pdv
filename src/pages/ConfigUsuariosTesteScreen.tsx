
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";
import { useToast } from "@/hooks/use-toast";

interface UsuarioTeste {
  identificacao_usuario: string;
  pedir_telefone: boolean;
  possui_dotz: boolean;
  outros_meios_pagamento: boolean;
  dotz_sem_app: boolean;
  permitir_pagamento_token: boolean;
}

const ConfigUsuariosTesteScreen = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // For now, using a hardcoded user ID - in a real app this would come from auth context
  const currentUserId = "f647bfee-faa2-4293-a5f2-d192a9e9f3f1";

  const fetchUsuariosTeste = async (): Promise<UsuarioTeste[]> => {
    const response = await fetch("https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/usuarios_teste", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975",
        "id_usuario": currentUserId,
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao carregar usuários de teste");
    }

    const data = await response.json();
    console.log("Resposta da API:", data);
    
    // Assuming the API returns data in format { data: [...] } or directly [...]
    return Array.isArray(data) ? data : data.data || [];
  };

  const { data: usuariosTeste = [], isLoading, error } = useQuery({
    queryKey: ["usuarios-teste"],
    queryFn: fetchUsuariosTeste,
  });

  // Handle error with useEffect to show toast
  React.useEffect(() => {
    if (error) {
      console.error("Erro ao carregar usuários de teste:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários de teste",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <ConfigLayoutWithSidebar>
      <div className="space-y-6 w-full max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/configuracoes")}
              className="text-gray-600 hover:text-dotz-laranja"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-dotz-laranja">Usuários de teste</h1>
          </div>
        </div>

        <div className="p-4 bg-dotz-offwhite rounded-md border border-dotz-pessego">
          <h2 className="font-semibold mb-2 text-dotz-laranja">Configurações do fluxo</h2>
          <p>Configure os usuários de teste para o fluxo do sistema.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-dotz-laranja">
              <FlaskConical className="h-6 w-6" />
              <span>Usuários de teste</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-gray-600">Carregando usuários de teste...</p>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-red-600">Erro ao carregar dados. Tente novamente.</p>
              </div>
            ) : usuariosTeste.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <p className="text-gray-600">Nenhum usuário de teste encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Usuário</TableHead>
                      <TableHead className="font-semibold text-center">Pedir telefone?</TableHead>
                      <TableHead className="font-semibold text-center">Possui Dotz?</TableHead>
                      <TableHead className="font-semibold text-center">Outros meios pagamento?</TableHead>
                      <TableHead className="font-semibold text-center">Pagamento sem APP?</TableHead>
                      <TableHead className="font-semibold text-center">Pagamento por token?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuariosTeste.map((usuario, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {usuario.identificacao_usuario}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Switch 
                              checked={usuario.pedir_telefone} 
                              disabled 
                              className="data-[state=checked]:bg-dotz-laranja"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Switch 
                              checked={usuario.possui_dotz} 
                              disabled 
                              className="data-[state=checked]:bg-dotz-laranja"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Switch 
                              checked={usuario.outros_meios_pagamento} 
                              disabled 
                              className="data-[state=checked]:bg-dotz-laranja"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Switch 
                              checked={usuario.dotz_sem_app} 
                              disabled 
                              className="data-[state=checked]:bg-dotz-laranja"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Switch 
                              checked={usuario.permitir_pagamento_token} 
                              disabled 
                              className="data-[state=checked]:bg-dotz-laranja"
                            />
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
      </div>
    </ConfigLayoutWithSidebar>
  );
};

export default ConfigUsuariosTesteScreen;
