import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Calendar, Hash, Server } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Transacao } from '@/types/transacao';

interface TransacaoDetalhesModalProps {
  transacao: Transacao | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransacaoDetalhesModal: React.FC<TransacaoDetalhesModalProps> = ({
  transacao,
  isOpen,
  onClose,
}) => {
  if (!transacao) return null;

  const formatarData = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm:ss", {
        locale: ptBR,
      });
    } catch {
      return dateString;
    }
  };

  const formatarJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const copiarTexto = async (texto: string, tipo: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(`${tipo} copiado para área de transferência`);
    } catch {
      toast.error(`Erro ao copiar ${tipo.toLowerCase()}`);
    }
  };

  const getServicoColor = (servico: string) => {
    const colors: Record<string, string> = {
      RLIINFO: 'bg-blue-100 text-blue-800',
      RLICELL: 'bg-green-100 text-green-800',
      RLIFUND: 'bg-orange-100 text-orange-800',
      RLIPAYS: 'bg-purple-100 text-purple-800',
      RLIUNDO: 'bg-red-100 text-red-800',
    };
    return colors[servico] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Detalhes da Transação</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">ID:</span>
              <span className="text-sm">{transacao.id}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Data/Hora:</span>
              <span className="text-sm">{formatarData(transacao.created_at)}</span>
            </div>
            
            <div className="flex items-center justify-between space-x-2 md:col-span-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Transaction ID:</span>
                <span className="text-sm font-mono bg-background px-2 py-1 rounded">
                  {transacao.transaction_id}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copiarTexto(transacao.transaction_id, 'Transaction ID')}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Serviço:</span>
              <Badge className={getServicoColor(transacao.servico)}>
                {transacao.servico}
              </Badge>
            </div>
          </div>

          {/* Tabs para Request e Response */}
          <Tabs defaultValue="request" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
            </TabsList>
            
            <TabsContent value="request" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Dados da Requisição</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copiarTexto(formatarJson(transacao.request), 'Request')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
                {formatarJson(transacao.request)}
              </pre>
            </TabsContent>
            
            <TabsContent value="response" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Dados da Resposta</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copiarTexto(formatarJson(transacao.response), 'Response')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
                {formatarJson(transacao.response)}
              </pre>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};