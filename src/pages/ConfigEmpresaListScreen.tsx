
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";
import { empresaService, type Empresa } from "@/services/empresaService";
import { createLogger } from '@/utils/logger';
import { toast } from "sonner";

const log = createLogger('ConfigEmpresaListScreen');

const ConfigEmpresaListScreen = () => {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEmpresas = async () => {
    try {
      log.info('Iniciando busca de empresas...');
      const userId = sessionStorage.getItem('user.uuid');
      if (!userId) {
        setError('Dados de autenticação não encontrados');
        setLoading(false);
        return;
      }
      const data = await empresaService.getEmpresas(userId);
      setEmpresas(data);
      setLoading(false);
    } catch (err) {
      log.error('Erro ao buscar empresas:', err);
      setError('Erro ao carregar a lista de empresas');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleEdit = (empresa: Empresa) => {
    log.info('Editar empresa:', empresa.id);
  };

  const handleDeleteConfirm = async () => {
    if (!empresaToDelete) return;

    const userId = sessionStorage.getItem('user.uuid');
    if (!userId) {
      toast.error('Dados de autenticação não encontrados');
      return;
    }

    setDeleting(true);
    try {
      await empresaService.deleteEmpresa(empresaToDelete.id, userId);
      toast.success(`Empresa "${empresaToDelete.nome}" excluída com sucesso`);
      setEmpresaToDelete(null);
      // Recarregar lista
      setEmpresas(prev => prev.filter(e => e.id !== empresaToDelete.id));
    } catch (err: any) {
      log.error('Erro ao excluir empresa:', err);
      toast.error(err.message || 'Erro ao excluir empresa');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <ConfigLayoutWithSidebar>
        <div className="space-y-6 w-full max-w-6xl">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/configuracoes")} className="text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-primary">Lista de Empresas</h1>
          </div>
          <div className="text-center py-8"><p>Carregando empresas...</p></div>
        </div>
      </ConfigLayoutWithSidebar>
    );
  }

  if (error) {
    return (
      <ConfigLayoutWithSidebar>
        <div className="space-y-6 w-full max-w-6xl">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/configuracoes")} className="text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-primary">Lista de Empresas</h1>
          </div>
          <div className="text-center py-8 text-destructive"><p>{error}</p></div>
        </div>
      </ConfigLayoutWithSidebar>
    );
  }

  return (
    <ConfigLayoutWithSidebar>
      <div className="space-y-6 w-full max-w-6xl">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/configuracoes")} className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-primary">Lista de Empresas</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Empresas Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            {empresas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma empresa encontrada.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empresas.map((empresa) => (
                      <TableRow key={empresa.id}>
                        <TableCell className="font-medium">{empresa.nome}</TableCell>
                        <TableCell>{empresa.cnpj}</TableCell>
                        <TableCell className="max-w-xs truncate">{empresa.endereco}</TableCell>
                        <TableCell>{empresa.email || '-'}</TableCell>
                        <TableCell>{empresa.telefone || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{empresa.descricao || '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2 justify-center">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(empresa)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEmpresaToDelete(empresa)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
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

      <AlertDialog open={!!empresaToDelete} onOpenChange={(open) => !open && !deleting && setEmpresaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa <strong>"{empresaToDelete?.nome}"</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Excluindo...</> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfigLayoutWithSidebar>
  );
};

export default ConfigEmpresaListScreen;
