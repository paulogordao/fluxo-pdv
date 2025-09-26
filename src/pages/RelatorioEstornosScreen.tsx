import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RotateCcw, Search, RefreshCw, AlertCircle, X } from 'lucide-react';
import { useTransacoesPays } from '@/hooks/useTransacoesPays';
import { useEstornoTransacao } from '@/hooks/useEstornoTransacao';
import { TransacaoEstorno } from '@/types/transacao';
import { useToast } from '@/hooks/use-toast';
import ConfigLayoutWithSidebar from '@/components/ConfigLayoutWithSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RelatorioEstornosScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, error, refetch, isRefetching } = useTransacoesPays();
  const estornoMutation = useEstornoTransacao();

  // Função para extrair dados do JSON de forma segura
  const parseTransactionData = (transacao: TransacaoEstorno) => {
    try {
      const request = JSON.parse(transacao.request);
      const response = JSON.parse(transacao.response);
      
      const transactionId = request?.data?.input?.transaction_id || 'N/A';
      const customerInfoId = response?.data?.customer_info_id || 'N/A';
      const amount = request?.data?.input?.payments?.[0]?.amount || 0;
      const success = response?.success || false;
      
      return {
        transactionId,
        customerInfoId,
        amount,
        success,
      };
    } catch (error) {
      console.error('Erro ao fazer parse dos dados:', error);
      return {
        transactionId: 'N/A',
        customerInfoId: 'N/A',
        amount: 0,
        success: false,
      };
    }
  };

  // Filtragem de transações
  const filteredTransactions = useMemo(() => {
    if (!data?.data) return [];
    
    return data.data.filter((transacao) => {
      // Primeiro filtrar apenas transações de sucesso
      const { success } = parseTransactionData(transacao);
      if (!success) return false;
      
      // Depois aplicar filtro de busca se houver
      if (!searchTerm) return true;
      
      const { transactionId, customerInfoId } = parseTransactionData(transacao);
      const searchLower = searchTerm.toLowerCase();
      
      return (
        transactionId.toLowerCase().includes(searchLower) ||
        customerInfoId.includes(searchTerm) ||
        transacao.id.toString().includes(searchTerm)
      );
    }).sort((a, b) => {
      // Ordenar por data decrescente (mais recente primeiro)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [data, searchTerm]);

  // Função para formatar valor em Real
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  // Função para processar estorno
  const handleEstorno = (transacao: TransacaoEstorno) => {
    if (confirm('Tem certeza que deseja estornar esta transação?')) {
      const { transactionId, customerInfoId } = parseTransactionData(transacao);
      
      estornoMutation.mutate({
        id: transacao.id.toString(),
        transactionId: transactionId || transacao.transaction_id,
        cpf: customerInfoId || '',
      });
    }
  };

  // Componente de loading
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex space-x-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );

  return (
    <ConfigLayoutWithSidebar>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Relatório de Estornos</h1>
            <p className="text-muted-foreground">
              Gerencie transações finalizadas que podem ser estornadas
            </p>
          </div>
          <Button 
            onClick={() => refetch()} 
            disabled={isRefetching}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por CPF, Transaction ID ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {searchTerm && (
              <p className="text-sm text-muted-foreground mt-2">
                {filteredTransactions.length} transação(ões) encontrada(s) para "{searchTerm}"
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Transações */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Disponíveis para Estorno</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erro ao carregar transações: {error.message}
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <RotateCcw className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {searchTerm 
                                ? 'Nenhuma transação encontrada com os filtros aplicados.'
                                : 'Nenhuma transação disponível para estorno.'
                              }
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transacao) => {
                        const { transactionId, customerInfoId, amount, success } = parseTransactionData(transacao);
                        
                        return (
                          <TableRow key={transacao.id}>
                            <TableCell className="font-mono text-sm">
                              {transacao.id}
                            </TableCell>
                            <TableCell>
                              {formatDate(transacao.created_at)}
                            </TableCell>
                            <TableCell className="font-mono text-sm max-w-xs truncate">
                              {transactionId}
                            </TableCell>
                            <TableCell className="font-mono">
                              {customerInfoId}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(amount)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={transacao.estornado || estornoMutation.isPending}
                                onClick={() => handleEstorno(transacao)}
                                className="gap-2"
                              >
                                {estornoMutation.isPending ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                                {transacao.estornado ? 'Estornado' : estornoMutation.isPending ? 'Estornando...' : 'Estornar'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
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

export default RelatorioEstornosScreen;