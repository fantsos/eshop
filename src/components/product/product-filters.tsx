"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface ProductFiltersProps {
  categories: { id: string; name: string; slug: string }[];
  brands: string[];
  currentCategory: string;
  currentBrand: string;
  currentMinPrice?: number;
  currentMaxPrice?: number;
  currentSort: string;
  locale: string;
}

export function ProductFilters({ categories, brands, currentCategory, currentBrand, currentMinPrice, currentMaxPrice }: ProductFiltersProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [minPrice, setMinPrice] = useState(currentMinPrice?.toString() || "");
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice?.toString() || "");

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const applyPrice = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice); else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice); else params.delete("maxPrice");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t("filters")}</h3>
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>Clear</Button>
      </div>
      <Separator />
      <div>
        <h4 className="font-medium mb-2">{t("categories")}</h4>
        <div className="space-y-1">
          <button onClick={() => updateFilter("category", "")} className={`block text-sm w-full text-left px-2 py-1 rounded ${!currentCategory ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}>{t("all")}</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => updateFilter("category", cat.id)} className={`block text-sm w-full text-left px-2 py-1 rounded ${currentCategory === cat.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}>{cat.name}</button>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <h4 className="font-medium mb-2">{t("price")}</h4>
        <div className="flex gap-2 items-center">
          <Input placeholder="Min" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-20" />
          <span>-</span>
          <Input placeholder="Max" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-20" />
          <Button size="sm" onClick={applyPrice}>OK</Button>
        </div>
      </div>
      <Separator />
      {brands.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">{t("brand")}</h4>
          <div className="space-y-1">
            <button onClick={() => updateFilter("brand", "")} className={`block text-sm w-full text-left px-2 py-1 rounded ${!currentBrand ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}>{t("all")}</button>
            {brands.map(b => (
              <button key={b} onClick={() => updateFilter("brand", b)} className={`block text-sm w-full text-left px-2 py-1 rounded ${currentBrand === b ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}>{b}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
