import { useState, useEffect, useRef } from 'react';
import { comandoService } from '@/services/comandoService';
import type { ComandoResponse } from '@/services/comandoService';

export interface PollingStatus {
  isPolling: boolean;
  attempts: number;
  lastAttemptTime: Date | null;
  startTime: Date | null;
  status: 'waiting' | 'polling' | 'completed' | 'cancelled' | 'error' | 'timeout';
  nextStepData: any | null;
  orderData: any | null;
  error: string | null;
}

export const useRliwaitPolling = (transactionId: string | null, autoStart: boolean = false) => {
  const [pollingStatus, setPollingStatus] = useState<PollingStatus>({
    isPolling: false,
    attempts: 0,
    lastAttemptTime: null,
    startTime: null,
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

  const performPolling = async (cancel: boolean = false): Promise<boolean> => {
    if (!transactionId || !isMountedRef.current) {
      return false;
    }

    // Verificar timeout de 5 minutos (300 segundos)
    const currentTime = new Date();
    if (pollingStatus.startTime) {
      const elapsedSeconds = (currentTime.getTime() - pollingStatus.startTime.getTime()) / 1000;
      if (elapsedSeconds >= 300) { // 5 minutos
        console.log(`[useRliwaitPolling] Timeout de 5 minutos atingido - parando polling`);
        setPollingStatus(prev => ({
          ...prev,
          isPolling: false,
          status: 'timeout'
        }));
        return false; // Parar polling
      }
    }

    try {
      console.log(`[useRliwaitPolling] Tentativa ${pollingStatus.attempts + 1} - Enviando RLIWAIT ${cancel ? '(CANCEL)' : ''} para transaction: ${transactionId}`);
      
      const response: ComandoResponse = await comandoService.enviarComandoRliwait(transactionId, cancel);
      
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
      startTime: new Date(),
      error: null
    }));

    // Primeira chamada imediata
    performPolling().then(shouldContinue => {
      if (shouldContinue && isMountedRef.current) {
        // Iniciar intervalos de 10 segundos
        intervalRef.current = setInterval(async () => {
          const continuePolling = await performPolling();
          if (!continuePolling && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }, 10000); // 10 segundos
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

  const sendCancelRequest = async () => {
    if (!transactionId) {
      console.error('[useRliwaitPolling] Cannot send cancel request - no transaction ID');
      return;
    }

    console.log(`[useRliwaitPolling] Enviando RLIWAIT com cancel=true para transaction: ${transactionId}`);
    
    try {
      await performPolling(true); // Envia com cancel=true
      console.log(`[useRliwaitPolling] Cancel request sent successfully`);
    } catch (error) {
      console.error('[useRliwaitPolling] Error sending cancel request:', error);
    }
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
    stopPolling,
    sendCancelRequest
  };
};