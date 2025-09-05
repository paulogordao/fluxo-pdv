/**
 * CNPJ validation and formatting utilities
 */

/**
 * Validates if a CNPJ is valid (14 digits only)
 * @param cnpj - CNPJ string to validate
 * @returns boolean indicating if CNPJ is valid
 */
export const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, "");
  return cleaned.length === 14 && /^\d{14}$/.test(cleaned);
};

/**
 * Normalizes CNPJ by removing all non-numeric characters
 * @param cnpj - CNPJ string to normalize
 * @returns normalized CNPJ with only numbers
 */
export const normalizeCNPJ = (cnpj: string): string => {
  return cnpj.replace(/\D/g, "");
};

/**
 * Formats CNPJ for display (xx.xxx.xxx/xxxx-xx)
 * @param cnpj - CNPJ string to format
 * @returns formatted CNPJ string
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, "");
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

/**
 * Formats CNPJ input with mask during typing
 * @param value - current input value
 * @returns formatted value for input
 */
export const formatCNPJInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  let formatted = cleaned;
  
  if (cleaned.length > 2) {
    formatted = cleaned.slice(0, 2) + "." + cleaned.slice(2);
  }
  if (cleaned.length > 5) {
    formatted = formatted.slice(0, 6) + "." + formatted.slice(6);
  }
  if (cleaned.length > 8) {
    formatted = formatted.slice(0, 10) + "/" + formatted.slice(10);
  }
  if (cleaned.length > 12) {
    formatted = formatted.slice(0, 15) + "-" + formatted.slice(15);
  }
  
  return formatted.slice(0, 18); // Limit to xx.xxx.xxx/xxxx-xx format
};