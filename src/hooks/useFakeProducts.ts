import { useQuery } from '@tanstack/react-query';
import { buscarProdutosFakes } from '@/services/produtoService';
import type { FakeProduct } from '@/services/produtoService';

const CACHE_RELOAD_INTERVAL = 15; // Recarregar a cada 15 acessos
const COUNTER_KEY = 'fake_products_access_count';
const CACHE_KEY = ['fake-products'];

// Função para gerenciar o contador de acessos
const getAndIncrementCounter = (): number => {
  const currentCount = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10);
  const newCount = currentCount + 1;
  
  if (newCount >= CACHE_RELOAD_INTERVAL) {
    // Reset counter after reaching limit
    localStorage.setItem(COUNTER_KEY, '0');
    return CACHE_RELOAD_INTERVAL; // Force refetch
  } else {
    localStorage.setItem(COUNTER_KEY, newCount.toString());
    return newCount;
  }
};

// Hook para gerenciar produtos fake com cache inteligente
export const useFakeProducts = () => {
  // Get current counter and determine if we should use fresh data
  const accessCount = getAndIncrementCounter();
  const shouldRefetch = accessCount >= CACHE_RELOAD_INTERVAL;
  
  const query = useQuery({
    queryKey: CACHE_KEY,
    queryFn: async () => {
      console.log('[useFakeProducts] Buscando produtos do backend...');
      
      // Fetch the original fake products data with full structure
      const response = await fetch('https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV/produtosFakes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975'
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Resposta da API inválida: propriedade "items" não encontrada ou não é um array');
      }
      
      console.log('[useFakeProducts] Produtos carregados:', data.items.length);
      return data.items as FakeProduct[];
    },
    staleTime: shouldRefetch ? 0 : 30 * 60 * 1000, // 30 minutes if not forcing refresh
    gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes (renamed from cacheTime in v5)
    refetchOnWindowFocus: false,
    retry: 2,
  });

  return {
    fakeProducts: query.data || [],
    isLoadingProducts: query.isLoading,
    productsError: query.error ? 'Erro ao carregar produtos' : null,
    refetch: query.refetch,
  };
};