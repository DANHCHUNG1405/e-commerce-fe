import { create } from "zustand";
import type { Product } from "@/types/product";

type CartItem = Pick<Product, "id" | "name" | "price" | "image"> & { quantity: number };

interface CartState {
  items: CartItem[];
  addItem: (product: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (product) =>
    set((state) => {
      const current = state.items.find((item) => item.id === product.id);
      return {
        items: current
          ? state.items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + product.quantity }
                : item,
            )
          : [...state.items, product],
      };
    }),
  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== productId) })),
  clearCart: () => set({ items: [] }),
}));
