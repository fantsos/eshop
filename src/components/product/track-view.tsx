"use client";

import { useEffect } from "react";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";

export function TrackView({ product }: { product: { id: string; name: string; slug: string; price: number; image: string } }) {
  const addProduct = useRecentlyViewedStore((s) => s.addProduct);

  useEffect(() => {
    addProduct(product);
  }, [product.id, addProduct]);

  return null;
}
