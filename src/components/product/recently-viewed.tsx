"use client";

import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import Link from "next/link";
import Image from "next/image";

export function RecentlyViewed() {
  const { products } = useRecentlyViewedStore();

  if (products.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-4">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {products.map((p) => (
          <Link key={p.id} href={`/product/${p.slug}`} className="flex-none w-40">
            <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-2">
              {p.image ? (
                <Image src={p.image} alt={p.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No image</div>
              )}
            </div>
            <p className="text-sm font-medium truncate">{p.name}</p>
            <p className="text-sm text-primary font-bold">&euro;{p.price.toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
