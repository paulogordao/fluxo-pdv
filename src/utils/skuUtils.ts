/**
 * Trunca o SKU para no máximo 10 caracteres
 * Retorna os últimos 10 caracteres para preservar a parte única do identificador
 * 
 * @param sku - SKU original (pode ter qualquer tamanho)
 * @returns SKU truncado com no máximo 10 caracteres
 * 
 * @example
 * truncateSku("0000000000074") // "0000000074"
 * truncateSku("ABC123") // "ABC123"
 */
export const truncateSku = (sku: string): string => {
  if (!sku) {
    return '';
  }
  
  if (sku.length <= 10) {
    return sku;
  }
  
  // Pegar os últimos 10 caracteres para preservar a parte única
  const truncated = sku.slice(-10);
  console.log(`[skuUtils] SKU truncado: "${sku}" -> "${truncated}"`);
  return truncated;
};
