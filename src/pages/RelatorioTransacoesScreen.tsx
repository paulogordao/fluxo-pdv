import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, FileText, Download, Filter, Eye, RefreshCw, Hash, Calendar, ChevronDown, ChevronRight, Expand, Minimize } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PermissionModal from "@/components/PermissionModal";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";
import { TransacaoDetalhesModal } from "@/components/TransacaoDetalhesModal";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useTransacoes } from "@/hooks/useTransacoes";
import { Transacao } from "@/types/transacao";

interface TransacaoGrouped {
  transaction_id: string;
  rliwaitGroup: {
    transacoes: Transacao[];
    count: number;
    firstCreatedAt: string;
    lastCreatedAt: string;
    isExpanded: boolean;
  } | null;
  outrasTransacoes: Transacao[];
  firstCreatedAt: string;
  totalCount: number;
  services: string[];
}

const RelatorioTransacoesScreen = () => {
  const navigate = useNavigate();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");
  const [selectedTransacao, setSelectedTransacao] = useState<Transacao | null>(null);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedRliwaitGroups, setExpandedRliwaitGroups] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const { hasPermission, isLoading: isCheckingPermission, error } = useUserPermissions();
  const { data: transacoesData, isLoading: isLoadingTransacoes, error: transacoesError, refetch } = useTransacoes();

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

  const handleVerDetalhes = (transacao: Transacao) => {
    setSelectedTransacao(transacao);
    setShowDetalhesModal(true);
  };

  const handleCloseDetalhesModal = () => {
    setShowDetalhesModal(false);
    setSelectedTransacao(null);
  };

  const formatarData = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", {
        locale: ptBR,
      });
    } catch {
      return dateString;
    }
  };

  const truncateTransactionId = (id: string | null | undefined, maxLength: number = 20) => {
    if (!id || typeof id !== 'string') {
      return 'N/A';
    }
    return id.length > maxLength ? `${id.substring(0, maxLength)}...` : id;
  };

  const getServiceOrder = (servico: string): number => {
    const order: Record<string, number> = {
      'RLIINFO': 1,
      'RLICELL': 2,
      'RLIFUND': 3,
      'RLIDEAL': 4,
      'RLIWAIT': 5,
      'RLIAUTH': 5, // Mesmo nível que RLIWAIT
      'RLIPAYS': 6,
      'RLIQUIT': 999 // Pode aparecer em qualquer lugar, mas vai para o final se não tiver contexto
    };
    return order[servico] || 1000; // Serviços desconhecidos vão para o final
  };

  const getServicoColor = (servico: string) => {
    const colors: Record<string, string> = {
      RLIINFO: 'bg-blue-100 text-blue-800',
      RLICELL: 'bg-green-100 text-green-800',
      RLIFUND: 'bg-orange-100 text-orange-800',
      RLIDEAL: 'bg-indigo-100 text-indigo-800',    // Nova cor
      RLIPAYS: 'bg-purple-100 text-purple-800',
      RLIUNDO: 'bg-red-100 text-red-800',
      RLIWAIT: 'bg-yellow-100 text-yellow-800',
      RLIAUTH: 'bg-cyan-100 text-cyan-800',        // Nova cor
      RLIQUIT: 'bg-slate-100 text-slate-800',      // Nova cor
    };
    return colors[servico] || 'bg-gray-100 text-gray-800';
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Dados atualizados com sucesso!");
  };

  // Group transactions by transaction_id with RLIWAIT grouping
  const groupedTransactions = useMemo(() => {
    if (!transacoesData?.data) return [];
    
    const groupMap = new Map<string, TransacaoGrouped>();
    
    // Filter out transactions with invalid transaction_id
    const validTransactions = transacoesData.data.filter((transacao) => {
      if (!transacao.transaction_id || typeof transacao.transaction_id !== 'string') {
        console.warn('Invalid transaction found:', transacao);
        return false;
      }
      return true;
    });
    
    validTransactions.forEach((transacao) => {
      const { transaction_id } = transacao;
      
      if (groupMap.has(transaction_id)) {
        const existing = groupMap.get(transaction_id)!;
        
        if (transacao.servico === 'RLIWAIT') {
          if (existing.rliwaitGroup) {
            existing.rliwaitGroup.transacoes.push(transacao);
            existing.rliwaitGroup.count++;
            // Update last created_at for RLIWAIT group
            if (new Date(transacao.created_at) > new Date(existing.rliwaitGroup.lastCreatedAt)) {
              existing.rliwaitGroup.lastCreatedAt = transacao.created_at;
            }
            // Update first created_at for RLIWAIT group
            if (new Date(transacao.created_at) < new Date(existing.rliwaitGroup.firstCreatedAt)) {
              existing.rliwaitGroup.firstCreatedAt = transacao.created_at;
            }
          } else {
            existing.rliwaitGroup = {
              transacoes: [transacao],
              count: 1,
              firstCreatedAt: transacao.created_at,
              lastCreatedAt: transacao.created_at,
              isExpanded: false,
            };
          }
        } else {
          existing.outrasTransacoes.push(transacao);
        }
        
        existing.totalCount++;
        if (!existing.services.includes(transacao.servico)) {
          existing.services.push(transacao.servico);
        }
        // Keep the earliest created_at
        if (new Date(transacao.created_at) < new Date(existing.firstCreatedAt)) {
          existing.firstCreatedAt = transacao.created_at;
        }
      } else {
        const group: TransacaoGrouped = {
          transaction_id,
          rliwaitGroup: null,
          outrasTransacoes: [],
          firstCreatedAt: transacao.created_at,
          totalCount: 1,
          services: [transacao.servico],
        };
        
        if (transacao.servico === 'RLIWAIT') {
          group.rliwaitGroup = {
            transacoes: [transacao],
            count: 1,
            firstCreatedAt: transacao.created_at,
            lastCreatedAt: transacao.created_at,
            isExpanded: false,
          };
        } else {
          group.outrasTransacoes = [transacao];
        }
        
        groupMap.set(transaction_id, group);
      }
    });
    
    return Array.from(groupMap.values()).sort((a, b) => 
      new Date(b.firstCreatedAt).getTime() - new Date(a.firstCreatedAt).getTime()
    );
  }, [transacoesData?.data]);

  const toggleGroup = (transactionId: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(transactionId)) {
      newExpandedGroups.delete(transactionId);
    } else {
      newExpandedGroups.add(transactionId);
    }
    setExpandedGroups(newExpandedGroups);
  };

  const toggleRliwaitGroup = (transactionId: string) => {
    const newExpandedRliwaitGroups = new Set(expandedRliwaitGroups);
    if (newExpandedRliwaitGroups.has(transactionId)) {
      newExpandedRliwaitGroups.delete(transactionId);
    } else {
      newExpandedRliwaitGroups.add(transactionId);
    }
    setExpandedRliwaitGroups(newExpandedRliwaitGroups);
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedGroups(new Set());
      setExpandedRliwaitGroups(new Set());
    } else {
      setExpandedGroups(new Set(groupedTransactions.map(g => g.transaction_id)));
    }
    setExpandAll(!expandAll);
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

          {/* Actions Section */}
          <Card className="w-full shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <Button variant="outline" disabled className="flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Exportar PDF</span>
                  </Button>
                  <Button variant="outline" disabled className="flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Exportar Excel</span>
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={toggleExpandAll}
                    disabled={isLoadingTransacoes || !groupedTransactions.length}
                    className="flex items-center space-x-2"
                  >
                    {expandAll ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                    <span>{expandAll ? 'Colapsar Todos' : 'Expandir Todos'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    disabled={isLoadingTransacoes}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingTransacoes ? 'animate-spin' : ''}`} />
                    <span>Atualizar</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Transações */}
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Transações</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTransacoes ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : transacoesError ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-red-300" />
                  <p className="text-lg mb-2 text-red-600">Erro ao carregar transações</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Houve um erro ao buscar os dados. Tente novamente.
                  </p>
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              ) : !groupedTransactions.length ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">Nenhuma transação encontrada</p>
                  <p className="text-sm text-gray-600">
                    Ainda não há transações para exibir.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Data/Hora</span>
                          </div>
                        </TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Serviços</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedTransactions.map((group) => (
                        <>
                          {/* Main Group Row */}
                          <TableRow 
                            key={group.transaction_id}
                            className="bg-muted/30 hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleGroup(group.transaction_id)}
                          >
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                {expandedGroups.has(group.transaction_id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {formatarData(group.firstCreatedAt)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              <span title={group.transaction_id}>
                                {truncateTransactionId(group.transaction_id, 30)}
                              </span>
                            </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {[...group.services, ...(group.rliwaitGroup ? ['RLIWAIT'] : [])]
                                    .filter((service, index, array) => array.indexOf(service) === index) // Remove duplicatas
                                    .sort((a, b) => getServiceOrder(a) - getServiceOrder(b))
                                    .map((servico, index) => {
                                      if (servico === 'RLIWAIT' && group.rliwaitGroup) {
                                        return (
                                          <Badge 
                                            key={index}
                                            className={`text-xs ${getServicoColor('RLIWAIT')} cursor-pointer hover:opacity-80`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleRliwaitGroup(group.transaction_id);
                                            }}
                                          >
                                            RLIWAIT ({group.rliwaitGroup.count}x)
                                          </Badge>
                                        );
                                      } else if (servico !== 'RLIWAIT') {
                                        return (
                                          <Badge 
                                            key={index}
                                            className={`text-xs ${getServicoColor(servico)}`}
                                          >
                                            {servico}
                                          </Badge>
                                        );
                                      }
                                      return null;
                                    })}
                                </div>
                              </TableCell>
                            <TableCell className="text-center font-medium">
                              {group.totalCount}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-xs text-muted-foreground">
                                {expandedGroups.has(group.transaction_id) ? 'Ocultar' : 'Expandir'}
                              </span>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded Individual Transactions */}
                          {expandedGroups.has(group.transaction_id) && (
                            <>
                              {/* RLIWAIT Group - Collapsed by default */}
                              {group.rliwaitGroup && (
                                <>
                                  <TableRow 
                                    className="bg-background border-l-4 border-l-yellow-200 cursor-pointer hover:bg-muted/30"
                                    onClick={() => toggleRliwaitGroup(group.transaction_id)}
                                  >
                                    <TableCell className="pl-8">
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        {expandedRliwaitGroups.has(group.transaction_id) ? (
                                          <ChevronDown className="h-3 w-3" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {formatarData(group.rliwaitGroup.firstCreatedAt)} - {formatarData(group.rliwaitGroup.lastCreatedAt)}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                      Polling ({group.rliwaitGroup.count} chamadas)
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={`${getServicoColor('RLIWAIT')} flex items-center gap-1`}>
                                        <Hash className="h-3 w-3" />
                                        RLIWAIT x{group.rliwaitGroup.count}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-center text-xs text-muted-foreground">
                                      {group.rliwaitGroup.count}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <span className="text-xs text-muted-foreground">
                                        {expandedRliwaitGroups.has(group.transaction_id) ? 'Ocultar' : 'Ver Todas'}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                  
                                  {/* Individual RLIWAIT transactions when expanded */}
                                  {expandedRliwaitGroups.has(group.transaction_id) &&
                                    group.rliwaitGroup.transacoes.map((transacao, index) => (
                                      <TableRow 
                                        key={`${group.transaction_id}-rliwait-${transacao.id}`}
                                        className="bg-yellow-50/50 border-l-4 border-l-yellow-300"
                                      >
                                        <TableCell className="pl-12">
                                          <div className="flex items-center space-x-1">
                                            <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                          {formatarData(transacao.created_at)}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                          ID: {transacao.id}
                                        </TableCell>
                                        <TableCell>
                                          <Badge className={getServicoColor('RLIWAIT')}>
                                            RLIWAIT
                                          </Badge>
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell className="text-center">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleVerDetalhes(transacao)}
                                            className="flex items-center space-x-1"
                                          >
                                            <Eye className="h-4 w-4" />
                                            <span>Ver Detalhes</span>
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  }
                                </>
                              )}

                               {/* Other Services - Normal display */}
                               {group.outrasTransacoes
                                 .sort((a, b) => {
                                   const orderA = getServiceOrder(a.servico);
                                   const orderB = getServiceOrder(b.servico);
                                   if (orderA !== orderB) {
                                     return orderA - orderB;
                                   }
                                   // Se mesmo serviço, ordenar por data
                                   return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                                 })
                                 .map((transacao) => (
                                <TableRow 
                                  key={`${group.transaction_id}-${transacao.id}`}
                                  className="bg-background border-l-4 border-l-muted"
                                >
                                  <TableCell className="pl-8">
                                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatarData(transacao.created_at)}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs text-muted-foreground">
                                    ID: {transacao.id}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getServicoColor(transacao.servico)}>
                                      {transacao.servico}
                                    </Badge>
                                  </TableCell>
                                  <TableCell></TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleVerDetalhes(transacao)}
                                      className="flex items-center space-x-1"
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span>Ver Detalhes</span>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </>
                          )}
                        </>
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

      <TransacaoDetalhesModal
        transacao={selectedTransacao}
        isOpen={showDetalhesModal}
        onClose={handleCloseDetalhesModal}
      />
    </>
  );
};

export default RelatorioTransacoesScreen;