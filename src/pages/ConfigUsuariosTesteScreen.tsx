
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FlaskConical, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";
import { useToast } from "@/hooks/use-toast";
import { testUserService, UsuarioTeste } from "@/services/testUserService";
import { useUserSession } from "@/hooks/useUserSession";
import { Badge } from "@/components/ui/badge";

const ConfigUsuariosTesteScreen = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cpfInput, setCpfInput] = React.useState("");
  
  // Use dynamic user ID from session and company type
  const { userId, isLoading: isLoadingUser, tipo_simulacao } = useUserSession();

  // Helper function to parse tags string into array
  const parseTags = (tags?: string): string[] => {
    if (!tags || !tags.trim()) return [];
    return tags.split(';').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  // Helper function to format CPF
  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, "");
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Check if company is OFFLINE type
  const isOfflineCompany = tipo_simulacao === "OFFLINE";

  const { data: usuariosTeste = [], isLoading, error } = useQuery({
    queryKey: ["usuarios-teste", userId],
    queryFn: () => {
      if (!userId) {
        throw new Error("User ID not available");
      }
      return testUserService.getUsuariosTeste(userId);
    },
    enabled: !!userId, // Only run query if we have a user ID
  });

  const updateMutation = useMutation({
    mutationFn: (usuario: UsuarioTeste) => {
      if (!userId) {
        throw new Error("User ID not available");
      }
      return testUserService.updateUsuarioTeste(usuario, userId);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Usuário teste atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["usuarios-teste", userId] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar usuário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário de teste",
        variant: "destructive",
      });
      // Refetch data to revert any optimistic updates
      queryClient.invalidateQueries({ queryKey: ["usuarios-teste", userId] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (cpf: string) => {
      if (!userId) {
        throw new Error("User ID not available");
      }
      return testUserService.createUsuarioTeste(cpf, userId);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Usuário cadastrado com sucesso",
      });
      setCpfInput("");
      queryClient.invalidateQueries({ queryKey: ["usuarios-teste", userId] });
    },
    onError: (error) => {
      console.error("Erro ao cadastrar usuário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o usuário de teste",
        variant: "destructive",
      });
    },
  });

  const handleSwitchChange = (usuario: UsuarioTeste, field: keyof Omit<UsuarioTeste, 'id' | 'identificacao_usuario'>, newValue: boolean) => {
    const updatedUsuario = {
      ...usuario,
      [field]: newValue,
    };

    console.log("Atualizando usuário:", updatedUsuario);
    updateMutation.mutate(updatedUsuario);
  };

  const handleCreateUser = () => {
    if (!cpfInput.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite um CPF válido",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Erro",
        description: "Sessão de usuário não encontrada",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(cpfInput.trim());
  };

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

  // Debug log to check data
  React.useEffect(() => {
    console.log("User ID:", userId);
    console.log("Dados dos usuários de teste:", usuariosTeste);
  }, [usuariosTeste, userId]);

  // Show loading state while getting user session
  if (isLoadingUser) {
    return (
      <ConfigLayoutWithSidebar>
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-600">Carregando sessão do usuário...</p>
        </div>
      </ConfigLayoutWithSidebar>
    );
  }

  // Show error if no user ID is available
  if (!userId) {
    return (
      <ConfigLayoutWithSidebar>
        <div className="flex justify-center items-center py-8">
          <p className="text-red-600">Erro: Sessão de usuário não encontrada. Faça login novamente.</p>
        </div>
      </ConfigLayoutWithSidebar>
    );
  }

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
            {/* Show creation form only for OFFLINE companies */}
            {isOfflineCompany && (
              <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Input
                    placeholder="Digite o CPF do usuário"
                    value={cpfInput}
                    onChange={(e) => setCpfInput(e.target.value)}
                    disabled={createMutation.isPending}
                  />
                </div>
                <Button
                  onClick={handleCreateUser}
                  disabled={createMutation.isPending || !cpfInput.trim()}
                  variant="dotz"
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Cadastrar</span>
                </Button>
              </div>
            )}

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
                {isOfflineCompany ? (
                  // Full table for OFFLINE companies
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
                        <TableRow key={usuario.id || index}>
                          <TableCell className="font-medium">
                            {usuario.identificacao_usuario}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch 
                                checked={usuario.pedir_telefone} 
                                onCheckedChange={(checked) => handleSwitchChange(usuario, 'pedir_telefone', checked)}
                                disabled={updateMutation.isPending}
                                className="data-[state=checked]:bg-dotz-laranja"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch 
                                checked={usuario.possui_dotz} 
                                onCheckedChange={(checked) => handleSwitchChange(usuario, 'possui_dotz', checked)}
                                disabled={updateMutation.isPending}
                                className="data-[state=checked]:bg-dotz-laranja"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch 
                                checked={usuario.outros_meios_pagamento} 
                                onCheckedChange={(checked) => handleSwitchChange(usuario, 'outros_meios_pagamento', checked)}
                                disabled={updateMutation.isPending}
                                className="data-[state=checked]:bg-dotz-laranja"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch 
                                checked={usuario.dotz_sem_app} 
                                onCheckedChange={(checked) => handleSwitchChange(usuario, 'dotz_sem_app', checked)}
                                disabled={updateMutation.isPending}
                                className="data-[state=checked]:bg-dotz-laranja"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <Switch 
                                checked={usuario.permitir_pagamento_token} 
                                onCheckedChange={(checked) => handleSwitchChange(usuario, 'permitir_pagamento_token', checked)}
                                disabled={updateMutation.isPending}
                                className="data-[state=checked]:bg-dotz-laranja"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  // Simplified table for non-OFFLINE companies
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">CPF</TableHead>
                        <TableHead className="font-semibold">Nome</TableHead>
                        <TableHead className="font-semibold">Tags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuariosTeste.map((usuario, index) => (
                        <TableRow key={usuario.id || index}>
                          <TableCell className="font-medium">
                            {formatCPF(usuario.identificacao_usuario)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {usuario.nome || "Nome não informado"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {parseTags(usuario.tags).length > 0 ? (
                                parseTags(usuario.tags).map((tag, tagIndex) => (
                                  <Badge 
                                    key={tagIndex} 
                                    variant="secondary" 
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-500 text-sm">Sem tags</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ConfigLayoutWithSidebar>
  );
};

export default ConfigUsuariosTesteScreen;
