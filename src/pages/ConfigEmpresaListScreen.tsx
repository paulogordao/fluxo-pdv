
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
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

const ConfigEmpresaListScreen = () => {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        console.log('Iniciando busca de empresas...');
        
        const apiKey = localStorage.getItem('apiKey');
        const userId = localStorage.getItem('userId');
        
        if (!apiKey || !userId) {
          setError('Dados de autenticação não encontrados');
          setLoading(false);
          return;
        }

        console.log('Fazendo requisição para buscar empresas...');
        const response = await fetch('https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/empresas', {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'id_usuario': userId,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Erro na requisição: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dados das empresas recebidos:', data);
        
        setEmpresas(data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar empresas:', err);
        setError('Erro ao carregar a lista de empresas');
        setLoading(false);
      }
    };

    fetchEmpresas();
  }, []);

  const handleEdit = (empresa: Empresa) => {
    console.log('Editar empresa:', empresa.id);
    // Funcionalidade será implementada posteriormente
  };

  const handleDelete = (empresa: Empresa) => {
    console.log('Apagar empresa:', empresa.id);
    // Funcionalidade será implementada posteriormente
  };

  if (loading) {
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
              <h1 className="text-3xl font-bold text-dotz-laranja">Lista de Empresas</h1>
            </div>
          </div>
          <div className="text-center py-8">
            <p>Carregando empresas...</p>
          </div>
        </div>
      </ConfigLayoutWithSidebar>
    );
  }

  if (error) {
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
              <h1 className="text-3xl font-bold text-dotz-laranja">Lista de Empresas</h1>
            </div>
          </div>
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
          </div>
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
            <h1 className="text-3xl font-bold text-dotz-laranja">Lista de Empresas</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-dotz-laranja">Empresas Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            {empresas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma empresa encontrada.</p>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(empresa)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(empresa)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
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
  );
};

export default ConfigEmpresaListScreen;
