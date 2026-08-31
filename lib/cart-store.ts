"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adoptLegacyKey } from "@/lib/legacy-storage";

const CART_KEY = "shp-cart";

// Run before the store is created, so persist() reads the carried-over entry on
// its first hydration rather than finding nothing and emptying a live basket.
adoptLegacyKey("bettershp-cart", CART_KEY);

export type CartItem = {
  /** Composite key so the same product in a different size/color is a separate line */
  key: string;
  productId: string;
  variantId: string;
  slug: string;
  title: string;
  image: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  stock: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "key">) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
  subtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const key = `${item.productId}:${item.variantId}`;
        set((state) => {
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            const nextQty = Math.min(existing.quantity + item.quantity, existing.stock);
            return {
              items: state.items.map((i) => (i.key === key ? { ...i, quantity: nextQty } : i)),
            };
          }
          return { items: [...state.items, { ...item, key }] };
        });
      },
      removeItem: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: CART_KEY }
  )
);
