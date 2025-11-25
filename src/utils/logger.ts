/**
 * Sistema de Logging Centralizado
 * 
 * Níveis de log (em ordem de severidade):
 * - debug: Informações detalhadas para debugging
 * - info: Informações gerais de fluxo
 * - warn: Avisos que não impedem execução
 * - error: Erros que afetam funcionalidade
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  showTimestamp: boolean;
}

// Configuração baseada no ambiente
const config: LoggerConfig = {
  enabled: import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGS === 'true',
  minLevel: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'debug',
  showTimestamp: import.meta.env.DEV,
};

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Cores para cada nível (apenas em desenvolvimento)
const LOG_COLORS: Record<LogLevel, string> = {
  debug: '#9CA3AF', // gray
  info: '#3B82F6',  // blue
  warn: '#F59E0B',  // yellow
  error: '#EF4444', // red
};

const shouldLog = (level: LogLevel): boolean => {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
};

const formatMessage = (module: string, level: LogLevel): string => {
  const timestamp = config.showTimestamp 
    ? `[${new Date().toISOString().slice(11, 23)}] ` 
    : '';
  return `${timestamp}[${module}]`;
};

/**
 * Cria um logger para um módulo específico
 * @param module Nome do módulo (ex: 'CpfScreen', 'transacaoService')
 */
export const createLogger = (module: string) => ({
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.log(
        `%c${formatMessage(module, 'debug')}`,
        `color: ${LOG_COLORS.debug}`,
        ...args
      );
    }
  },
  
  info: (...args: unknown[]) => {
    if (shouldLog('info')) {
      console.log(
        `%c${formatMessage(module, 'info')}`,
        `color: ${LOG_COLORS.info}`,
        ...args
      );
    }
  },
  
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(
        `%c${formatMessage(module, 'warn')}`,
        `color: ${LOG_COLORS.warn}`,
        ...args
      );
    }
  },
  
  error: (...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error(
        `%c${formatMessage(module, 'error')}`,
        `color: ${LOG_COLORS.error}`,
        ...args
      );
    }
  },
});

// Logger genérico para uso rápido
export const logger = {
  debug: (module: string, ...args: unknown[]) => createLogger(module).debug(...args),
  info: (module: string, ...args: unknown[]) => createLogger(module).info(...args),
  warn: (module: string, ...args: unknown[]) => createLogger(module).warn(...args),
  error: (module: string, ...args: unknown[]) => createLogger(module).error(...args),
};

export default logger;
