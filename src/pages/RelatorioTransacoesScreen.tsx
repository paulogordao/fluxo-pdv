import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, Filter } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import PermissionModal from "@/components/PermissionModal";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";
import { useUserPermissions } from "@/hooks/useUserPermissions";

const RelatorioTransacoesScreen = () => {
  const navigate = useNavigate();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");

  const { hasPermission, isLoading: isCheckingPermission, error } = useUserPermissions();

  // Check user permissions on component mount
  useEffect(() => {
    if (!isCheckingPermission && !error) {
      const userEmail = sessionStorage.getItem("user.login");
      const userUUID = sessionStorage.getItem("user.uuid");
      
      if (!userEmail || !userUUID) {
        setPermissionMessage("Sessão expirada. Faça login novamente.");
        setShowPermissionModal(true);
        return;
      }

      if (!hasPermission("menu_relatorio_transacao")) {
        setPermissionMessage("Você não possui permissão para acessar esta funcionalidade.");
        setShowPermissionModal(true);
        return;
      }
    }

    if (error) {
      setPermissionMessage("Erro ao verificar permissões. Tente novamente.");
      setShowPermissionModal(true);
    }
  }, [hasPermission, isCheckingPermission, error]);

  const handlePermissionModalClose = () => {
    setShowPermissionModal(false);
    navigate("/configuracoes");
  };

  if (isCheckingPermission) {
    return (
      <ConfigLayoutWithSidebar>
        <Card className="w-full max-w-md p-6 shadow-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dotz-laranja mx-auto mb-4"></div>
            <p>Verificando permissões...</p>
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
              <h1 className="text-3xl font-bold text-dotz-laranja">Relatório de Transações</h1>
            </div>
          </div>

          <Card className="border-dotz-laranja/20 bg-dotz-laranja/5">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  <h2 className="text-xl font-semibold text-red-600">Consulta de Transações</h2>
                </div>
                <p className="text-gray-600">
                  Visualize e exporte relatórios das transações realizadas no sistema. 
                  Use os filtros para refinar sua busca.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Filters Section */}
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtros</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500 text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">Funcionalidade em Desenvolvimento</p>
                <p className="text-sm">
                  Os filtros e relatórios de transações serão implementados em breve.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions Section */}
          <Card className="w-full shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Button variant="dotz" disabled className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Exportar PDF</span>
                </Button>
                <Button variant="outline" disabled className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Exportar Excel</span>
                </Button>
              </div>
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

export default RelatorioTransacoesScreen;