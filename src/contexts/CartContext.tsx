import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  variant?: string; // e.g., "100g" - the selected size/variant
  weight?: string; // Product weight string from database e.g., "500g", "1kg", "250ml"
};

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  clear: () => void;
  totalCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "cart_items_v2"; // v2 to handle variant-aware items

// Generate unique cart key for item identification
const getCartItemKey = (productId: string, variant?: string): string => {
  return variant ? `${productId}-${variant}` : productId;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    setItems((prev) => {
      // Find existing item by productId AND variant (if specified)
      const existing = prev.find((i) => 
        i.productId === item.productId && i.variant === item.variant
      );
      
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId && i.variant === item.variant
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeItem: CartContextValue["removeItem"] = (productId, variant) => {
    setItems((prev) => prev.filter((i) => 
      !(i.productId === productId && i.variant === variant)
    ));
  };

  const updateQuantity: CartContextValue["updateQuantity"] = (productId, quantity, variant) => {
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId && i.variant === variant ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const clear: CartContextValue["clear"] = () => setItems([]);

  const totalCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    totalCount,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};
