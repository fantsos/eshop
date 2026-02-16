import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RecentProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
}

interface RecentlyViewedStore {
  products: RecentProduct[];
  addProduct: (product: RecentProduct) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      products: [],
      addProduct: (product) => {
        const current = get().products.filter((p) => p.id !== product.id);
        set({ products: [product, ...current].slice(0, 12) });
      },
      clear: () => set({ products: [] }),
    }),
    { name: "recently-viewed" }
  )
);
