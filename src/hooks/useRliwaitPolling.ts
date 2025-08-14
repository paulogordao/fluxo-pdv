import { useState, useEffect, useRef } from 'react';
import { comandoService } from '@/services/comandoService';
import type { ComandoResponse } from '@/services/comandoService';

export interface PollingStatus {
  isPolling: boolean;
  attempts: number;
  lastAttemptTime: Date | null;
  status: 'waiting' | 'polling' | 'completed' | 'cancelled' | 'error';
  nextStepData: any | null;
  orderData: any | null;
  error: string | null;
}

export const useRliwaitPolling = (transactionId: string | null, autoStart: boolean = false) => {
  const [pollingStatus, setPollingStatus] = useState<PollingStatus>({
    isPolling: false,
    attempts: 0,
    lastAttemptTime: null,
    status: 'waiting',
    nextStepData: null,
    orderData: null,
    error: null
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const performPolling = async (): Promise<boolean> => {
    if (!transactionId || !isMountedRef.current) {
      return false;
    }

    try {
      console.log(`[useRliwaitPolling] Tentativa ${pollingStatus.attempts + 1} - Enviando RLIWAIT para transaction: ${transactionId}`);
      
      const response: ComandoResponse = await comandoService.enviarComandoRliwait(transactionId);
      
      if (!isMountedRef.current) return false;

      const nextStep = response[0]?.response?.data?.next_step?.[0];
      const responseData = response[0]?.response?.data;
      console.log(`[useRliwaitPolling] Next step recebido:`, nextStep);
      console.log(`[useRliwaitPolling] Complete response data:`, responseData);

      setPollingStatus(prev => ({
        ...prev,
        attempts: prev.attempts + 1,
        lastAttemptTime: new Date(),
        nextStepData: nextStep,
        orderData: responseData,
        error: null
      }));

      // Verificar se ainda deve continuar o polling
      if (nextStep?.description === 'RLIWAIT') {
        console.log(`[useRliwaitPolling] Continuing polling - status still RLIWAIT`);
        return true; // Continuar polling
      } else {
        console.log(`[useRliwaitPolling] Polling completed - next_step changed to:`, nextStep?.description);
        setPollingStatus(prev => ({
          ...prev,
          isPolling: false,
          status: 'completed'
        }));
        return false; // Parar polling
      }

    } catch (error) {
      console.error('[useRliwaitPolling] Erro durante polling:', error);
      
      if (!isMountedRef.current) return false;

      setPollingStatus(prev => ({
        ...prev,
        attempts: prev.attempts + 1,
        lastAttemptTime: new Date(),
        error: error.message || 'Erro desconhecido',
        status: 'error'
      }));
      
      // Em caso de erro, continuar tentando (pode ser problema temporário)
      return true;
    }
  };

  const startPolling = () => {
    if (!transactionId) {
      console.error('[useRliwaitPolling] Cannot start polling - no transaction ID');
      return;
    }

    console.log(`[useRliwaitPolling] Iniciando polling para transaction: ${transactionId}`);
    
    setPollingStatus(prev => ({
      ...prev,
      isPolling: true,
      status: 'polling',
      attempts: 0,
      error: null
    }));

    // Primeira chamada imediata
    performPolling().then(shouldContinue => {
      if (shouldContinue && isMountedRef.current) {
        // Iniciar intervalos de 30 segundos
        intervalRef.current = setInterval(async () => {
          const continuePolling = await performPolling();
          if (!continuePolling && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }, 30000); // 30 segundos
      }
    });
  };

  const stopPolling = () => {
    console.log('[useRliwaitPolling] Parando polling');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setPollingStatus(prev => ({
      ...prev,
      isPolling: false,
      status: prev.status === 'completed' ? 'completed' : 'cancelled'
    }));
  };

  // Auto start polling se solicitado
  useEffect(() => {
    if (autoStart && transactionId) {
      startPolling();
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [transactionId, autoStart]);

  return {
    pollingStatus,
    startPolling,
    stopPolling
  };
};