
import React, { createContext, useContext, useState, useCallback } from 'react';
import { createLogger } from '@/utils/logger';

const log = createLogger('PdvContext');

// Tipos para os produtos
export interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
  image?: string;
  quantity?: number;
}

// Interface do contexto
interface PdvContextType {
  cart: Product[];
  addToCart: (product: Product) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalAmount: number;
  setInitialCart: (products: Product[]) => void;
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
    log.info('API Call: POST /api/cart/items', {
      product_id: product.id,
      quantity: 1
    });
  };

  const increaseQuantity = (productId: string) => {
    setCart(currentCart => {
      const productIndex = currentCart.findIndex(p => p.id === productId);
      
      if (productIndex === -1) return currentCart;
      
      const updatedCart = [...currentCart];
      const product = updatedCart[productIndex];
      updatedCart[productIndex] = {
        ...product,
        quantity: (product.quantity || 1) + 1,
      };
      return updatedCart;
    });
    
    log.info('API Call: PATCH /api/cart/items/' + productId, {
      action: 'increase',
      quantity: 1
    });
  };

  const decreaseQuantity = (productId: string) => {
    setCart(currentCart => {
      const productIndex = currentCart.findIndex(p => p.id === productId);
      
      if (productIndex === -1) return currentCart;
      
      const product = currentCart[productIndex];
      const currentQuantity = product.quantity || 1;
      
      if (currentQuantity <= 1) {
        // Se quantidade é 1, remove o produto do carrinho
        log.info('API Call: DELETE /api/cart/items/' + productId);
        return currentCart.filter(item => item.id !== productId);
      } else {
        // Se quantidade é maior que 1, diminui em 1
        const updatedCart = [...currentCart];
        updatedCart[productIndex] = {
          ...product,
          quantity: currentQuantity - 1,
        };
        log.info('API Call: PATCH /api/cart/items/' + productId, {
          action: 'decrease',
          quantity: -1
        });
        return updatedCart;
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
    
    // Simular log de chamada à API
    log.info('API Call: DELETE /api/cart/items/' + productId);
  };

  const clearCart = () => {
    setCart([]);
    
    // Simular log de chamada à API
    log.info('API Call: DELETE /api/cart');
  };

  // Adicionar função para definir o carrinho inicial
  // Memoizado para prevenir loops infinitos
  const setInitialCart = useCallback((products: Product[]) => {
    log.debug('setInitialCart called with', products.length, 'products');
    setCart(products);
  }, []); // Dependências vazias = referência estável

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
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        totalAmount,
        setInitialCart,
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
