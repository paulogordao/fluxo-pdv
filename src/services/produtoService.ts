import { buildApiUrl, API_CONFIG } from '@/config/api';
import { Product } from '@/context/PdvContext';

export interface FakeProduct {
  ean: string;
  sku: string;
  unit_price: number;
  discount: number;
  quantity: number;
  name: string;
  unit_type: string;
  brand?: string;
  manufacturer?: string;
  categories: string[];
  gross_profit_amount: number;
  is_private_label: boolean;
  is_on_sale: boolean;
  image?: string;
}

export interface FakeProductsResponse {
  items: FakeProduct[];
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

    const data: FakeProductsResponse = await response.json();
    console.log('[produtoService] Dados recebidos:', data);

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Resposta da API inválida: propriedade "items" não encontrada ou não é um array');
    }

    // Convert FakeProduct to Product format
    const products: Product[] = data.items.map(item => ({
      id: item.ean, // Using EAN as ID since API doesn't provide unique ID
      name: item.name,
      price: item.unit_price,
      barcode: item.ean,
      image: item.image,
    }));

    console.log('[produtoService] Produtos convertidos:', products);
    return products;
  } catch (error) {
    console.error('[produtoService] Erro ao buscar produtos fake:', error);
    throw error;
  }
};