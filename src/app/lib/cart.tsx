import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { SearchResult } from './api';

const CART_STORAGE_KEY = 'pillpoint-cart';

export interface CartItem {
  id: string;
  shopId: string;
  pharmacyName: string;
  medicineName: string;
  price: number;
  quantity: number;
  inStock: boolean;
  phone: string;
  address: string;
  area: string;
  distance: number;
  rating: number;
  reviews: number;
  shopImage?: string;
  medicineImage?: string;
  category: string;
  openTime: string;
  closeTime: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  addItem: (medicine: SearchResult) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const clampQuantity = (quantity: number) => (Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1);

const mapSearchResultToCartItem = (medicine: SearchResult): CartItem => ({
  id: medicine.id,
  shopId: medicine.shopId,
  pharmacyName: medicine.name,
  medicineName: medicine.medicineName || medicine.name,
  price: medicine.price,
  quantity: 1,
  inStock: medicine.inStock,
  phone: medicine.phone,
  address: medicine.address,
  area: medicine.area,
  distance: medicine.distance,
  rating: medicine.rating,
  reviews: medicine.reviews,
  shopImage: medicine.shopImage,
  medicineImage: medicine.medicineImage,
  category: medicine.category,
  openTime: medicine.openTime,
  closeTime: medicine.closeTime,
});

const loadCartItems = (): CartItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        ...item,
        quantity: clampQuantity(Number(item.quantity)),
        inStock: Boolean(item.inStock),
      }))
      .filter((item) => item.id && item.medicineName && item.pharmacyName);
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCartItems);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (medicine: SearchResult) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === medicine.id);

      if (existingItem) {
        return currentItems.map((item) => (
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }

      return [...currentItems, mapSearchResultToCartItem(medicine)];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    const nextQuantity = clampQuantity(quantity);

    setItems((currentItems) => {
      if (nextQuantity < 1) {
        return currentItems.filter((item) => item.id !== id);
      }

      return currentItems.map((item) => (
        item.id === id
          ? { ...item, quantity: nextQuantity }
          : item
      ));
    });
  };

  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}