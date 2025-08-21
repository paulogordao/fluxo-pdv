import { format, parse, isValid } from "date-fns";

/**
 * Formata uma data ISO (YYYY-MM-DD) para o formato brasileiro (DD/MM/AAAA)
 */
export const formatDateBR = (isoDate: string): string => {
  if (!isoDate) return "";
  
  try {
    // Parse explícito para evitar problemas de timezone
    const date = parse(isoDate, "yyyy-MM-dd", new Date());
    if (!isValid(date)) return "";
    
    return format(date, "dd/MM/yyyy");
  } catch {
    return "";
  }
};

/**
 * Converte uma data brasileira (DD/MM/AAAA) para formato ISO (YYYY-MM-DD)
 */
export const parseDateISO = (brDate: string): string => {
  if (!brDate) return "";
  
  try {
    const date = parse(brDate, "dd/MM/yyyy", new Date());
    if (!isValid(date)) return "";
    
    return format(date, "yyyy-MM-dd");
  } catch {
    return "";
  }
};

/**
 * Valida se uma data está no futuro
 */
export const isFutureDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Final do dia de hoje
  return date > today;
};

/**
 * Valida se uma string de data é válida
 */
export const isValidDateString = (dateString: string, format: 'ISO' | 'BR' = 'ISO'): boolean => {
  if (!dateString) return false;
  
  try {
    let date: Date;
    
    if (format === 'ISO') {
      date = new Date(dateString);
    } else {
      date = parse(dateString, "dd/MM/yyyy", new Date());
    }
    
    return isValid(date) && !isFutureDate(date);
  } catch {
    return false;
  }
};