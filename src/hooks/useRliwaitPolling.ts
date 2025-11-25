import { useState, useEffect, useRef, useCallback } from 'react';
import { comandoService } from '@/services/comandoService';
import type { ComandoResponse } from '@/services/comandoService';
import { createLogger } from '@/utils/logger';

const log = createLogger('useRliwaitPolling');

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
      log.debug('isMountedRef cleanup - forcing stop');
      isMountedRef.current = false;
      
      // ✅ FORÇAR LIMPEZA IMEDIATA DO INTERVALO
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        log.debug('Interval forcefully cleared on unmount');
      }
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
        log.info(`Timeout de 5 minutos atingido - parando polling`);
        setPollingStatus(prev => ({
          ...prev,
          isPolling: false,
          status: 'timeout'
        }));
        return false; // Parar polling
      }
    }

    try {
      log.debug(`Tentativa ${pollingStatus.attempts + 1} - Enviando RLIWAIT ${cancel ? '(CANCEL)' : ''} para transaction: ${transactionId}`);
      
      const response: ComandoResponse = await comandoService.enviarComandoRliwait(transactionId, cancel);
      
      if (!isMountedRef.current) return false;

      const nextStep = response[0]?.response?.data?.next_step?.[0];
      const responseData = response[0]?.response?.data;
      log.debug(`Next step recebido:`, nextStep);
      log.debug(`Complete response data:`, responseData);

      setPollingStatus(prev => ({
        ...prev,
        attempts: 0, // ✅ RESETAR contador ao ter sucesso
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

      const newAttempts = pollingStatus.attempts + 1;
      
      setPollingStatus(prev => ({
        ...prev,
        attempts: newAttempts,
        lastAttemptTime: new Date(),
        error: error.message || 'Erro desconhecido',
        status: 'error'
      }));
      
      // ❌ PARAR POLLING APÓS 3 ERROS CONSECUTIVOS
      if (newAttempts >= 3) {
        console.error('[useRliwaitPolling] ❌ Múltiplos erros consecutivos detectados - PARANDO polling');
        setPollingStatus(prev => ({
          ...prev,
          isPolling: false,
          status: 'error'
        }));
        return false; // PARAR polling
      }
      
      // Em caso de erro, continuar tentando apenas se menos de 3 erros
      console.warn('[useRliwaitPolling] Erro detectado, mas continuando polling (tentativa ' + newAttempts + '/3)');
      return true;
    }
  };

  const startPolling = useCallback(() => {
    if (!transactionId) {
      console.error('[useRliwaitPolling] Cannot start polling - no transaction ID');
      return;
    }

    // Prevenir múltiplos intervalos
    if (intervalRef.current) {
      console.warn('[useRliwaitPolling] Polling already running - stopping previous instance');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
        const intervalId = Date.now(); // Identificador único para debug
        console.log(`[useRliwaitPolling] Created interval ${intervalId} for transaction ${transactionId}`);
        
        // Iniciar intervalos de 10 segundos
        intervalRef.current = setInterval(async () => {
          console.log(`[useRliwaitPolling] Interval ${intervalId} tick - isMounted: ${isMountedRef.current}`);
          
          // ✅ VERIFICAR SE COMPONENTE AINDA ESTÁ MONTADO
          if (!isMountedRef.current) {
            console.warn(`[useRliwaitPolling] Interval ${intervalId} - Component unmounted - stopping interval`);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return;
          }
          
          const continuePolling = await performPolling();
          if (!continuePolling && intervalRef.current) {
            console.log(`[useRliwaitPolling] Interval ${intervalId} - Polling complete - clearing interval`);
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }, 10000); // 10 segundos
      }
    });
  }, [transactionId]);

  const stopPolling = useCallback(() => {
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
  }, []);

  const sendCancelRequest = useCallback(async () => {
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
  }, [transactionId]);

  // Cleanup on unmount - SEM DEPENDÊNCIAS para evitar loops
  useEffect(() => {
    return () => {
      console.log('[useRliwaitPolling] Component unmounting - cleaning up interval');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Array vazio - só executa no unmount

  return {
    pollingStatus,
    startPolling,
    stopPolling,
    sendCancelRequest
  };
};