
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";
import { empresaService, type Empresa } from "@/services/empresaService";
import { createLogger } from '@/utils/logger';

const log = createLogger('ConfigEmpresaEditarScreen');

const ConfigEmpresaEditarScreen = () => {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      setError(null);

      const idUsuario = sessionStorage.getItem('user.uuid');

      log.debug('ID Usuário encontrado:', idUsuario ? 'Sim' : 'Não');
      log.debug('ID Usuário valor:', idUsuario);

      if (!idUsuario) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      log.info('Fazendo requisição para listar todas as empresas...');
      
      const empresas = await empresaService.getEmpresas(idUsuario);
      log.debug('Dados das empresas recebidos:', empresas);
      
      setEmpresas(empresas);
    } catch (err) {
      log.error('Erro ao buscar empresas:', err);
      setError('Erro ao carregar a lista de empresas. Verifique sua autenticação.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleEdit = (empresa: Empresa) => {
    log.info('Editar empresa:', empresa);
    navigate(`/config_empresa_edit/${empresa.id}`);
  };

  const handleDelete = (empresa: Empresa) => {
    log.info('Apagar empresa:', empresa);
    // Funcionalidade será implementada posteriormente
  };

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
            <h1 className="text-3xl font-bold text-dotz-laranja">Empresas Cadastradas</h1>
          </div>
        </div>

        <div className="p-4 bg-dotz-offwhite rounded-md border border-dotz-pessego">
          <h2 className="font-semibold mb-2 text-dotz-laranja">Gerenciar Empresas</h2>
          <p>Visualize e gerencie as empresas cadastradas no sistema.</p>
        </div>

        {loading && (
          <div className="flex justify-center items-center p-8">
            <div className="text-gray-600">Carregando empresas...</div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={fetchEmpresas}
              variant="outline"
              className="mt-2"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Nome</TableHead>
                  <TableHead className="font-semibold text-gray-700">CNPJ</TableHead>
                  <TableHead className="font-semibold text-gray-700">Endereço</TableHead>
                  <TableHead className="font-semibold text-gray-700">E-mail</TableHead>
                  <TableHead className="font-semibold text-gray-700">Telefone</TableHead>
                  <TableHead className="font-semibold text-gray-700">Descrição</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhuma empresa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  empresas.map((empresa) => (
                    <TableRow key={empresa.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{empresa.nome}</TableCell>
                      <TableCell>{empresa.cnpj}</TableCell>
                      <TableCell className="max-w-xs truncate" title={empresa.endereco}>
                        {empresa.endereco}
                      </TableCell>
                      <TableCell>{empresa.email || '-'}</TableCell>
                      <TableCell>{empresa.telefone || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate" title={empresa.descricao || ''}>
                        {empresa.descricao || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(empresa)}
                            className="text-dotz-laranja border-dotz-laranja hover:bg-dotz-laranja hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(empresa)}
                            className="text-red-600 border-red-300 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </ConfigLayoutWithSidebar>
  );
};

export default ConfigEmpresaEditarScreen;
