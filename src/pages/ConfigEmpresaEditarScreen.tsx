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

interface Empresa {
  id: string;
  created_at: string;
  nome: string;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  endereco: string;
  descricao: string | null;
}

const ConfigEmpresaEditarScreen = () => {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Recuperar dados do sessionStorage com as chaves corretas do login
      const apiKey = '0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975';
      const idUsuario = sessionStorage.getItem('user.uuid');

      console.log('API Key:', apiKey ? 'Configurada' : 'Não encontrada');
      console.log('ID Usuário encontrado:', idUsuario ? 'Sim' : 'Não');
      console.log('ID Usuário valor:', idUsuario);

      if (!idUsuario) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      console.log('Fazendo requisição para buscar empresas...');
      const response = await fetch('https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/empresas', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'id_usuario': idUsuario,
          'Content-Type': 'application/json',
        },
      });

      console.log('Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Erro da API:', errorText);
        throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Dados das empresas recebidos:', responseData);
      
      // Verificar se a resposta contém a propriedade 'data' com array de empresas
      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        console.log('Resposta contém array de empresas na propriedade data com', responseData.data.length, 'empresas');
        setEmpresas(responseData.data);
      } else {
        console.log('Resposta não contém dados de empresas válidos na propriedade data');
        setEmpresas([]);
      }
    } catch (err) {
      console.error('Erro ao buscar empresas:', err);
      setError('Erro ao carregar a lista de empresas. Verifique sua autenticação.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleEdit = (empresa: Empresa) => {
    console.log('Editar empresa:', empresa);
    navigate(`/config_empresa_edit/${empresa.id}`);
  };

  const handleDelete = (empresa: Empresa) => {
    console.log('Apagar empresa:', empresa);
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
