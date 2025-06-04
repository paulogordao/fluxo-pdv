
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { User, Edit, Trash2, ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PermissionModal from "@/components/PermissionModal";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";
import { userService, UsuarioData } from "@/services/userService";

const ConfigUsuarioEditScreen = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<UsuarioData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setIsLoading(true);
      
      const userEmail = sessionStorage.getItem("user.login");
      const userUUID = sessionStorage.getItem("user.uuid");
      
      if (!userEmail || !userUUID) {
        setPermissionMessage("Sessão expirada. Faça login novamente.");
        setShowPermissionModal(true);
        return;
      }

      console.log("Buscando usuários...");
      
      const data = await userService.getUsers(userUUID);
      console.log("Dados recebidos:", data);
      
      if (data.data && Array.isArray(data.data)) {
        setUsuarios(data.data);
      } else {
        setUsuarios([]);
        toast.error("Formato de resposta inesperado da API.");
      }
      
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error("Erro ao carregar usuários. Tente novamente.");
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleEdit = (usuario: string) => {
    const userData = usuarios.find(u => u.usuario === usuario);
    if (userData && userData.id) {
      navigate(`/config_usuario_edit_individual/${encodeURIComponent(userData.id)}`);
    } else {
      toast.error("Não foi possível identificar o usuário para edição.");
    }
  };

  const handleDelete = (usuario: string) => {
    console.log("Excluir usuário:", usuario);
    toast.info("Funcionalidade de exclusão será implementada em breve.");
  };

  const handlePermissionModalClose = () => {
    setShowPermissionModal(false);
    navigate("/index");
  };

  if (isLoading) {
    return (
      <ConfigLayoutWithSidebar>
        <Card className="w-full max-w-6xl shadow-lg">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dotz-laranja mr-4"></div>
            <p>Carregando usuários...</p>
          </div>
        </Card>
      </ConfigLayoutWithSidebar>
    );
  }

  return (
    <>
      <ConfigLayoutWithSidebar>
        <div className="space-y-6 w-full max-w-6xl">
          {/* Header Section */}
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
              <h1 className="text-3xl font-bold text-dotz-laranja">Lista de Usuários</h1>
            </div>
          </div>

          <Card className="border-dotz-laranja/20 bg-dotz-laranja/5">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-red-600" />
                  <h2 className="text-xl font-semibold text-red-600">Gerenciar Usuários</h2>
                </div>
                <p className="text-gray-600">
                  Utilize esta seção para visualizar e modificar os dados dos usuários existentes. Lembre-se de revisar o perfil e a empresa vinculada antes de fazer alterações.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full shadow-lg">
            <CardContent className="pt-6">
              {usuarios.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum usuário encontrado</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Não há usuários cadastrados no sistema no momento.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarios.map((usuario, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {usuario.usuario}
                          </TableCell>
                          <TableCell>{usuario.nome}</TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell>
                            {usuario.empresa || (
                              <span className="text-gray-400 italic">
                                Sem empresa vinculada
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(usuario.criado_em)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(usuario.usuario)}
                                className="text-dotz-laranja border-dotz-laranja hover:bg-dotz-laranja hover:text-white"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(usuario.usuario)}
                                className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

      <PermissionModal
        isOpen={showPermissionModal}
        onClose={handlePermissionModalClose}
        message={permissionMessage}
      />
    </>
  );
};

export default ConfigUsuarioEditScreen;
