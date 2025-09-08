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
  formatJson(jsonString: string): string {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Se não for JSON válido, retorna o texto original
      return jsonString;
    }
  },

  formatServiceDetails(transacao: Transacao, rliwaitInfo?: string): string {
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

    // Formatar título do serviço
    let serviceTitle = `[${timestamp}] ${transacao.servico} - Status: ${status}`;
    if (responseTime !== 'N/A') {
      if (typeof responseTime === 'string' && !responseTime.includes('ms')) {
        responseTime += 'ms';
      }
      serviceTitle += ` - Tempo: ${responseTime}`;
    }
    if (rliwaitInfo) {
      serviceTitle += ` ${rliwaitInfo}`;
    }

    // Formatear request e response
    const formattedRequest = this.formatJson(transacao.request);
    const formattedResponse = this.formatJson(transacao.response);

    // Indentar cada linha do JSON
    const indentedRequest = formattedRequest.split('\n').map(line => `│ ${line}`).join('\n');
    const indentedResponse = formattedResponse.split('\n').map(line => `│ ${line}`).join('\n');

    let content = '';
    content += '┌─────────────────────────────────────────────────────────────────\n';
    content += `│ ${serviceTitle}\n`;
    content += '├─────────────────────────────────────────────────────────────────\n';
    content += '│ REQUEST:\n';
    content += `${indentedRequest}\n`;
    content += '│\n';
    content += '│ RESPONSE:\n';
    content += `${indentedResponse}\n`;
    content += '└─────────────────────────────────────────────────────────────────\n\n';

    return content;
  },

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
        if (transacao.servico === 'RLIWAIT') {
          const rliwaitInfo = `(Polling ${rliwaitCounter}/${rliwaitTotal})`;
          content += this.formatServiceDetails(transacao, rliwaitInfo);
          rliwaitCounter++;
        } else {
          content += this.formatServiceDetails(transacao);
        }
      });

      if (index < selectedTransactions.length - 1) {
        content += '===================================================================\n\n';
      }
    });

    content += '===================================================================\n';
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