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

interface Transacao {
  id: number;
  created_at: string;
  transaction_id: string;
  servico: string;
  request: string;
  response: string;
}

export const exportService = {
  generateLogContent(allTransactions: TransacaoGrouped[], selectedTransactionIds: string[]): string {
    const selectedTransactions = allTransactions.filter(t => 
      selectedTransactionIds.includes(t.transaction_id)
    );

    const now = new Date();
    const dateHeader = now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    let content = '';
    content += '===================================================================\n';
    content += 'RELATÓRIO DE TRANSAÇÕES - SIMULADOR PDV\n';
    content += `Data de Geração: ${dateHeader}\n`;
    content += `Total de Transações: ${selectedTransactions.length}\n`;
    content += '===================================================================\n\n';

    selectedTransactions.forEach((group, index) => {
      const allTransacoesGroup = this.getAllTransactionsForGroup(group);
      const groupDate = new Date(group.firstCreatedAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      content += `TRANSAÇÃO: ${group.transaction_id}\n`;
      content += `Data/Hora: ${groupDate}\n`;
      
      const allServices = [...group.services];
      if (group.rliwaitGroup) {
        allServices.push('RLIWAIT');
      }
      content += `Serviços: ${allServices.join(', ')}\n`;
      content += `Total de Chamadas: ${group.totalCount}\n\n`;

      // Organizar todas as transações por timestamp
      const sortedTransactions = allTransacoesGroup.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Contador para RLIWAIT polling
      let rliwaitCounter = 1;
      const rliwaitTotal = group.rliwaitGroup?.count || 0;

      sortedTransactions.forEach((transacao) => {
        const timestamp = new Date(transacao.created_at).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        // Parse response para extrair informações técnicas
        let status = '200';
        let responseTime = 'N/A';
        try {
          const responseData = JSON.parse(transacao.response);
          status = responseData.status || responseData.statusCode || '200';
          responseTime = responseData.responseTime || 'N/A';
        } catch (e) {
          // Response não é JSON válido, usar valores padrão
        }

        if (transacao.servico === 'RLIWAIT') {
          content += `[${timestamp}] ${transacao.servico} - Status: ${status} - Tempo: ${responseTime}`;
          if (typeof responseTime === 'string' && !responseTime.includes('ms')) {
            responseTime += 'ms';
          }
          content += ` (Polling ${rliwaitCounter}/${rliwaitTotal})\n`;
          rliwaitCounter++;
        } else {
          content += `[${timestamp}] ${transacao.servico} - Status: ${status}`;
          if (responseTime !== 'N/A') {
            if (typeof responseTime === 'string' && !responseTime.includes('ms')) {
              responseTime += 'ms';
            }
            content += ` - Tempo: ${responseTime}`;
          }
          content += '\n';
        }
      });

      if (index < selectedTransactions.length - 1) {
        content += '\n-------------------------------------------------------------------\n\n';
      }
    });

    content += '\n===================================================================\n';
    content += 'FIM DO RELATÓRIO\n';
    content += '===================================================================\n';

    return content;
  },

  getAllTransactionsForGroup(group: TransacaoGrouped): Transacao[] {
    const allTransactions: Transacao[] = [...group.outrasTransacoes];
    
    if (group.rliwaitGroup) {
      allTransactions.push(...group.rliwaitGroup.transacoes);
    }
    
    return allTransactions;
  },

  downloadLogFile(content: string): void {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z/, '')
      .slice(0, 13); // YYYYMMDD_HHMM

    const filename = `transacoes_log_${timestamp}.txt`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  },

  exportTransactions(allTransactions: TransacaoGrouped[], selectedTransactionIds: string[]): void {
    const content = this.generateLogContent(allTransactions, selectedTransactionIds);
    this.downloadLogFile(content);
  }
};