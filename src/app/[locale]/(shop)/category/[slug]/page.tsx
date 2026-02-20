import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export async function generateMetadata({ params: { locale, slug } }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return {};
  const baseUrl = process.env.NEXTAUTH_URL || "https://fantsos.gr";
  const name = locale === "en" ? category.nameEn : category.nameEl;
  const metaTitle = (locale === "en" ? category.metaTitleEn : category.metaTitleEl) || name;
  const metaDescription = (locale === "en" ? category.metaDescriptionEn : category.metaDescriptionEl) || `${name} - E-Shop`;
  const canonical = `${baseUrl}/${locale}/category/${category.slug}`;
  return {
    title: metaTitle,
    description: metaDescription,
    keywords: category.metaKeywords || undefined,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonical,
      siteName: "E-Shop",
      locale: locale === "el" ? "el_GR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: metaTitle,
      description: metaDescription,
    },
    alternates: {
      canonical,
      languages: {
        el: `${baseUrl}/el/category/${category.slug}`,
        en: `${baseUrl}/en/category/${category.slug}`,
      },
    },
  };
}

const PAGE_SIZE = 12;

export default async function CategoryPage({ params: { locale, slug }, searchParams }: { params: { locale: string; slug: string }; searchParams: { page?: string; sort?: string } }) {
  const t = await getTranslations("common");
  const prefix = locale === "en" ? "/en" : "";
  const page = parseInt(searchParams.page || "1");
  const sort = searchParams.sort || "newest";

  const category = await prisma.category.findUnique({ where: { slug }, include: { children: true } });
  if (!category) notFound();

  const categoryIds = [category.id, ...category.children.map(c => c.id)];
  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  else if (sort === "price_desc") orderBy = { price: "desc" };
  else if (sort === "popular") orderBy = { salesCount: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true, categoryId: { in: categoryIds } }, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.product.count({ where: { isActive: true, categoryId: { in: categoryIds } } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const name = locale === "en" ? category.nameEn : category.nameEl;
  const seoH1 = (locale === "en" ? category.seoH1En : category.seoH1El) || name;
  const seoH2 = locale === "en" ? category.seoH2En : category.seoH2El;
  const serializeProduct = (p: any) => ({ ...p, price: Number(p.price), compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null, avgRating: Number(p.avgRating), flashSalePrice: p.flashSalePrice ? Number(p.flashSalePrice) : null, flashSaleEnd: p.flashSaleEnd ? p.flashSaleEnd.toISOString() : null, weight: p.weight ? Number(p.weight) : null });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">{seoH1}</h1>
      {seoH2 && <h2 className="text-lg text-muted-foreground mb-1">{seoH2}</h2>}
      <p className="text-muted-foreground mb-6">{total} {t("products")}</p>
      {category.children.length > 0 && (<div className="flex flex-wrap gap-2 mb-6">{category.children.map(sub => (<Link key={sub.id} href={`${prefix}/category/${sub.slug}`}><Button variant="outline" size="sm">{locale === "en" ? sub.nameEn : sub.nameEl}</Button></Link>))}</div>)}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm">{t("sortBy")}:</span>
        {[{ key: "newest", label: t("newest") }, { key: "price_asc", label: t("priceLowHigh") }, { key: "price_desc", label: t("priceHighLow") }, { key: "popular", label: t("popularity") }].map(s => (
          <Link key={s.key} href={`${prefix}/category/${slug}?sort=${s.key}`}><Button variant={sort === s.key ? "default" : "outline"} size="sm">{s.label}</Button></Link>
        ))}
      </div>
      {products.length === 0 ? <p className="text-center py-16 text-muted-foreground">{t("noResults")}</p> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{products.map(p => <ProductCard key={p.id} product={serializeProduct(p)} />)}</div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && <Link href={`${prefix}/category/${slug}?sort=${sort}&page=${page - 1}`}><Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button></Link>}
          <span className="text-sm">{page} / {totalPages}</span>
          {page < totalPages && <Link href={`${prefix}/category/${slug}?sort=${sort}&page=${page + 1}`}><Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button></Link>}
        </div>
      )}
    </div>
  );
}
