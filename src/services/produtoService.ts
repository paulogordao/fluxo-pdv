import { buildApiUrl, API_CONFIG } from '@/config/api';
import { Product } from '@/context/PdvContext';

export interface FakeProduct {
  id: string;
  nome: string;
  preco: number;
  ean: string;
}

export const buscarProdutosFakes = async (): Promise<Product[]> => {
  try {
    console.log('[produtoService] Iniciando busca de produtos fake...');
    
    const url = buildApiUrl('produtosFakes');
    console.log('[produtoService] URL da requisição:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.defaultHeaders,
    });

    console.log('[produtoService] Status da resposta:', response.status);
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    const data: FakeProduct[] = await response.json();
    console.log('[produtoService] Dados recebidos:', data);

    // Convert FakeProduct to Product format
    const products: Product[] = data.map(item => ({
      id: item.id,
      name: item.nome,
      price: item.preco,
      barcode: item.ean,
    }));

    console.log('[produtoService] Produtos convertidos:', products);
    return products;
  } catch (error) {
    console.error('[produtoService] Erro ao buscar produtos fake:', error);
    throw error;
  }
};