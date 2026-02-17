import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("meta.productsTitle"), description: t("meta.productsDescription") };
}

const PAGE_SIZE = 12;

export default async function ProductsPage({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: { [key: string]: string | undefined } }) {
  const t = await getTranslations("common");
  const prefix = locale === "en" ? "/en" : "";
  const page = parseInt(searchParams.page || "1");
  const search = searchParams.search || "";
  const sort = searchParams.sort || "newest";
  const category = searchParams.category || "";
  const minPrice = searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined;
  const brand = searchParams.brand || "";
  const featured = searchParams.featured === "true";

  const where: any = { isActive: true };
  if (search) { where.OR = [{ nameEl: { contains: search, mode: "insensitive" } }, { nameEn: { contains: search, mode: "insensitive" } }, { brand: { contains: search, mode: "insensitive" } }]; }
  if (category) where.categoryId = category;
  if (brand) where.brand = { contains: brand, mode: "insensitive" };
  if (featured) where.isFeatured = true;
  if (minPrice || maxPrice) { where.price = {}; if (minPrice) where.price.gte = minPrice; if (maxPrice) where.price.lte = maxPrice; }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  else if (sort === "price_desc") orderBy = { price: "desc" };
  else if (sort === "popular") orderBy = { salesCount: "desc" };

  const [products, total, categories, brands] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.product.count({ where }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    prisma.product.findMany({ where: { isActive: true, brand: { not: null } }, select: { brand: true }, distinct: ["brand"] }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const serializeProduct = (p: any) => ({ ...p, price: Number(p.price), compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null, avgRating: Number(p.avgRating), flashSalePrice: p.flashSalePrice ? Number(p.flashSalePrice) : null, flashSaleEnd: p.flashSaleEnd ? p.flashSaleEnd.toISOString() : null, weight: p.weight ? Number(p.weight) : null });

  const buildUrl = (params: Record<string, string>) => {
    const sp = new URLSearchParams();
    const allParams = { search, sort, category, brand, page: page.toString(), ...params };
    Object.entries(allParams).forEach(([k, v]) => { if (v && v !== "" && !(k === "page" && v === "1")) sp.set(k, v); });
    const qs = sp.toString();
    return `${prefix}/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">{t("products")}</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <ProductFilters categories={categories.map(c => ({ id: c.id, name: locale === "en" ? c.nameEn : c.nameEl, slug: c.slug }))} brands={brands.map(b => b.brand!).filter(Boolean)} currentCategory={category} currentBrand={brand} currentMinPrice={minPrice} currentMaxPrice={maxPrice} currentSort={sort} locale={locale} />
        </aside>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">{total} {t("products")}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm">{t("sortBy")}:</span>
              {[{ key: "newest", label: t("newest") }, { key: "price_asc", label: t("priceLowHigh") }, { key: "price_desc", label: t("priceHighLow") }, { key: "popular", label: t("popularity") }].map(s => (
                <Link key={s.key} href={buildUrl({ sort: s.key, page: "1" })}><Button variant={sort === s.key ? "default" : "outline"} size="sm">{s.label}</Button></Link>
              ))}
            </div>
          </div>
          {products.length === 0 ? (
            <div className="text-center py-16"><p className="text-muted-foreground text-lg">{t("noResults")}</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map(p => <ProductCard key={p.id} product={serializeProduct(p)} />)}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {page > 1 && <Link href={buildUrl({ page: (page - 1).toString() })}><Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button></Link>}
              <span className="text-sm">{page} / {totalPages}</span>
              {page < totalPages && <Link href={buildUrl({ page: (page + 1).toString() })}><Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button></Link>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
