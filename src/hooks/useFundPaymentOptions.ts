import { useState, useEffect } from "react";

export interface FundPaymentOption {
  option: string;
  message: string;
}

export interface FundPaymentOptionsData {
  payment_options: FundPaymentOption[];
}

export interface MappedPaymentOption {
  id: string;
  label: string;
  available: boolean;
}

export const useFundPaymentOptions = () => {
  const [paymentOptions, setPaymentOptions] = useState<MappedPaymentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnlineMode, setIsOnlineMode] = useState(false);

  useEffect(() => {
    const loadFundPaymentOptions = () => {
      try {
        // Recuperar dados do FUND do localStorage
        const rlifundResponseString = localStorage.getItem('rlifundResponse');
        console.log('[useFundPaymentOptions] Raw RLIFUND response:', rlifundResponseString);
        
        if (!rlifundResponseString) {
          console.log('[useFundPaymentOptions] No RLIFUND data found, using default options');
          setIsOnlineMode(false);
          setPaymentOptions(getDefaultOptions());
          setLoading(false);
          return;
        }

        const rlifundResponse = JSON.parse(rlifundResponseString);
        console.log('[useFundPaymentOptions] Parsed RLIFUND response:', rlifundResponse);
        
        // Verificar se tem payment_options (indicativo de modo ONLINE)
        const fundPaymentOptions = rlifundResponse.payment_options;
        if (!fundPaymentOptions || !Array.isArray(fundPaymentOptions)) {
          console.log('[useFundPaymentOptions] No payment_options found, using default options');
          setIsOnlineMode(false);
          setPaymentOptions(getDefaultOptions());
          setLoading(false);
          return;
        }

        console.log('[useFundPaymentOptions] Found payment_options:', fundPaymentOptions);
        setIsOnlineMode(true);
        
        // Mapear as opções do FUND para o formato esperado
        const mappedOptions = mapFundOptions(fundPaymentOptions);
        setPaymentOptions(mappedOptions);
        
      } catch (error) {
        console.error('[useFundPaymentOptions] Error loading FUND payment options:', error);
        setIsOnlineMode(false);
        setPaymentOptions(getDefaultOptions());
      } finally {
        setLoading(false);
      }
    };

    loadFundPaymentOptions();
  }, []);

  // Mapear opções do FUND para o formato da tela
  const mapFundOptions = (fundOptions: FundPaymentOption[]): MappedPaymentOption[] => {
    const mappedOptions: MappedPaymentOption[] = [];
    
    // Buscar cada tipo de opção
    const appOption = fundOptions.find(opt => opt.option === 'app');
    const outrosPagamentosOption = fundOptions.find(opt => opt.option === 'outros_pagamentos');
    const dotzOption = fundOptions.find(opt => opt.option === 'dotz');
    
    // Opção 1: App (sempre primeiro se disponível)
    if (appOption) {
      mappedOptions.push({
        id: 'app',
        label: `1. ${appOption.message}`,
        available: true
      });
    }
    
    // Opção 2: Outros pagamentos
    if (outrosPagamentosOption) {
      mappedOptions.push({
        id: 'outros_pagamentos',
        label: `2. ${outrosPagamentosOption.message}`,
        available: true
      });
    }
    
    // Opção 3: Dotz
    if (dotzOption) {
      mappedOptions.push({
        id: 'dotz',
        label: `3. ${dotzOption.message}`,
        available: true
      });
    }
    
    // Opção 4: Nenhum (sempre disponível)
    mappedOptions.push({
      id: 'none',
      label: '4. Nenhum',
      available: true
    });
    
    console.log('[useFundPaymentOptions] Mapped options:', mappedOptions);
    return mappedOptions;
  };

  // Opções padrão para modo OFFLINE (baseado no comportamento atual)
  const getDefaultOptions = (): MappedPaymentOption[] => {
    return [
      {
        id: 'app',
        label: '1. Até R$68,93 no APP',
        available: true
      },
      {
        id: 'livelo',
        label: '2. R$60 (Outros pagamentos) sem APP',
        available: true
      },
      {
        id: 'dotz',
        label: '3. R$3 (Dotz) sem APP',
        available: true
      },
      {
        id: 'none',
        label: '4. Nenhum',
        available: true
      }
    ];
  };

  return {
    paymentOptions,
    loading,
    isOnlineMode
  };
};