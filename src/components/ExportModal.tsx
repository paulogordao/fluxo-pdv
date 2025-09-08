import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransacaoGrouped {
  transaction_id: string;
  firstCreatedAt: string;
  totalCount: number;
  services: string[];
  rliwaitGroup?: {
    count: number;
    transacoes: any[];
  };
  outrasTransacoes: any[];
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransacaoGrouped[];
  onExport: (selectedIds: string[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onExport
}) => {
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTransactionIds([]);
      setSelectAll(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectAll(selectedTransactionIds.length === transactions.length);
  }, [selectedTransactionIds, transactions]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactionIds(transactions.map(t => t.transaction_id));
    } else {
      setSelectedTransactionIds([]);
    }
    setSelectAll(checked);
  };

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactionIds(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactionIds(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleExport = () => {
    if (selectedTransactionIds.length > 0) {
      onExport(selectedTransactionIds);
      onClose();
    }
  };

  const truncateTransactionId = (id: string, maxLength: number = 20) => {
    if (id.length <= maxLength) return id;
    return `${id.substring(0, maxLength)}...`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportar Log de Transações
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Selecionar Todas ({transactions.length} transações)
            </label>
          </div>

          <ScrollArea className="h-96 border rounded-lg p-4">
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.transaction_id}
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    id={transaction.transaction_id}
                    checked={selectedTransactionIds.includes(transaction.transaction_id)}
                    onCheckedChange={(checked) => 
                      handleSelectTransaction(transaction.transaction_id, checked as boolean)
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium">
                        {truncateTransactionId(transaction.transaction_id)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(transaction.firstCreatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {transaction.services.length} serviços • {transaction.totalCount} chamadas totais
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {transaction.services.join(', ')}
                      {transaction.rliwaitGroup && ` • RLIWAIT (${transaction.rliwaitGroup.count}x)`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedTransactionIds([])}
            disabled={selectedTransactionIds.length === 0}
          >
            Limpar Seleção
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedTransactionIds.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Log ({selectedTransactionIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};