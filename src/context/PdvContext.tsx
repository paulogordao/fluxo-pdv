
import React, { createContext, useContext, useState } from 'react';

// Tipos para os produtos
export interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
  image?: string;
  quantity?: number;
}

// Mock de produtos
export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Água Mineral 500ml',
    price: 2.50,
    barcode: '7891000315507',
  },
  {
    id: '2',
    name: 'Barra de Chocolate',
    price: 4.99,
    barcode: '7891008086697',
  },
  {
    id: '3',
    name: 'Pão Integral',
    price: 7.90,
    barcode: '7896002301428',
  },
  {
    id: '4',
    name: 'Sabonete Líquido',
    price: 12.50,
    barcode: '7896085867560',
  },
];

// Interface do contexto
interface PdvContextType {
  cart: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  findProductByBarcode: (barcode: string) => Product | undefined;
  totalAmount: number;
}

// Criando contexto
const PdvContext = createContext<PdvContextType | undefined>(undefined);

// Provedor do contexto
export const PdvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Product[]>([]);

  const addToCart = (product: Product) => {
    setCart(currentCart => {
      // Verificar se o produto já existe no carrinho
      const existingProductIndex = currentCart.findIndex(p => p.id === product.id);
      
      if (existingProductIndex > -1) {
        // Se existir, aumenta a quantidade
        const updatedCart = [...currentCart];
        const existingProduct = updatedCart[existingProductIndex];
        updatedCart[existingProductIndex] = {
          ...existingProduct,
          quantity: (existingProduct.quantity || 1) + 1,
        };
        return updatedCart;
      } else {
        // Se não existir, adiciona como novo item com quantidade 1
        return [...currentCart, { ...product, quantity: 1 }];
      }
    });
    
    // Simular log de chamada à API
    console.log('API Call: POST /api/cart/items', {
      product_id: product.id,
      quantity: 1
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
    
    // Simular log de chamada à API
    console.log('API Call: DELETE /api/cart/items/' + productId);
  };

  const clearCart = () => {
    setCart([]);
    
    // Simular log de chamada à API
    console.log('API Call: DELETE /api/cart');
  };

  const findProductByBarcode = (barcode: string): Product | undefined => {
    return MOCK_PRODUCTS.find(p => p.barcode === barcode);
  };

  // Calcular valor total do carrinho
  const totalAmount = cart.reduce(
    (total, item) => total + item.price * (item.quantity || 1),
    0
  );

  return (
    <PdvContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        findProductByBarcode,
        totalAmount,
      }}
    >
      {children}
    </PdvContext.Provider>
  );
};

// Hook para usar o contexto
export const usePdv = () => {
  const context = useContext(PdvContext);
  if (context === undefined) {
    throw new Error('usePdv must be used within a PdvProvider');
  }
  return context;
};
