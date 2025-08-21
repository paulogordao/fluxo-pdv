/**
 * CPF validation and formatting utilities
 */

/**
 * Validates if a CPF is valid (11 digits only)
 * @param cpf - CPF string to validate
 * @returns boolean indicating if CPF is valid
 */
export const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.length === 11 && /^\d{11}$/.test(cleaned);
};

/**
 * Normalizes CPF by adding leading zeros if needed
 * @param cpf - CPF string to normalize
 * @returns normalized CPF with 11 digits
 */
export const normalizeCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.padStart(11, "0");
};

/**
 * Formats CPF for display (xxx.xxx.xxx-xx)
 * @param cpf - CPF string to format
 * @returns formatted CPF string
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

/**
 * Formats CPF input with mask during typing
 * @param value - current input value
 * @returns formatted value for input
 */
export const formatCPFInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  let formatted = cleaned;
  
  if (cleaned.length > 3) {
    formatted = cleaned.slice(0, 3) + "." + cleaned.slice(3);
  }
  if (cleaned.length > 6) {
    formatted = formatted.slice(0, 7) + "." + formatted.slice(7);
  }
  if (cleaned.length > 9) {
    formatted = formatted.slice(0, 11) + "-" + formatted.slice(11);
  }
  
  return formatted.slice(0, 14); // Limit to xxx.xxx.xxx-xx format
};