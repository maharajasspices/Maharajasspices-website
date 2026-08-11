import { useEffect } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export const useCartPersistence = (
  items: CartItem[],
  setItems: (items: CartItem[]) => void
) => {
  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('maharaja_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          setItems(parsedCart);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, [setItems]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('maharaja_cart', JSON.stringify(items));
    } else {
      localStorage.removeItem('maharaja_cart');
    }
  }, [items]);
};
