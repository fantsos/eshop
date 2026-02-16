import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, Shield, Headphones, CreditCard } from "lucide-react";
import { OrganizationJsonLd } from "@/components/seo/json-ld";

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("common");
  const prefix = locale === "en" ? "/en" : "";

  const [featuredProducts, newProducts, categories, flashSaleProducts] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { salesCount: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { order: "asc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        flashSalePrice: { not: null },
        flashSaleEnd: { gt: new Date() },
      },
      orderBy: { flashSaleEnd: "asc" },
      take: 4,
    }),
  ]);

  const serializeProduct = (p: any) => ({
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    avgRating: Number(p.avgRating),
    flashSalePrice: p.flashSalePrice ? Number(p.flashSalePrice) : null,
    flashSaleEnd: p.flashSaleEnd ? p.flashSaleEnd.toISOString() : null,
    weight: p.weight ? Number(p.weight) : null,
  });

  return (
    <div>
      <OrganizationJsonLd />
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {locale === "en"
                ? "Shop the Latest Trends"
                : "Αγοράστε τις Τελευταίες Τάσεις"}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {locale === "en"
                ? "Discover amazing deals on electronics, home goods, fashion and more. Free shipping on orders over €50."
                : "Ανακαλύψτε εκπληκτικές προσφορές σε ηλεκτρονικά, είδη σπιτιού, μόδα και πολλά άλλα. Δωρεάν αποστολή σε παραγγελίες άνω των 50€."}
            </p>
            <div className="flex gap-4">
              <Link href={`${prefix}/products`}>
                <Button size="lg">
                  {t("products")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={`${prefix}/deals`}>
                <Button size="lg" variant="outline">
                  {t("deals")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y bg-muted/30">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{t("freeShipping")}</p>
                <p className="text-xs text-muted-foreground">{locale === "en" ? "On orders over €50" : "Σε παραγγελίες άνω 50€"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{locale === "en" ? "Secure Payment" : "Ασφαλής Πληρωμή"}</p>
                <p className="text-xs text-muted-foreground">{locale === "en" ? "SSL encrypted" : "Κρυπτογράφηση SSL"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Headphones className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{locale === "en" ? "24/7 Support" : "Υποστήριξη 24/7"}</p>
                <p className="text-xs text-muted-foreground">{locale === "en" ? "Always here to help" : "Πάντα εδώ για εσάς"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{locale === "en" ? "Easy Returns" : "Εύκολες Επιστροφές"}</p>
                <p className="text-xs text-muted-foreground">{locale === "en" ? "30-day return policy" : "Επιστροφή εντός 30 ημερών"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t("categories")}</h2>
            <Link href={`${prefix}/categories`} className="text-primary hover:underline text-sm">
              {t("viewAll")} <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`${prefix}/category/${cat.slug}`}>
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted group">
                  {cat.image && (
                    <Image src={cat.image} alt={locale === "en" ? cat.nameEn : cat.nameEl} fill className="object-cover group-hover:scale-105 transition-transform" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <h3 className="font-semibold">{locale === "en" ? cat.nameEn : cat.nameEl}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Flash Sale */}
      {flashSaleProducts.length > 0 && (
        <section className="bg-red-50 py-12">
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-red-600">{t("flashSale")}</h2>
              <Link href={`${prefix}/deals`} className="text-red-600 hover:underline text-sm">
                {t("viewAll")} <ArrowRight className="inline h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {flashSaleProducts.map((product) => (
                <ProductCard key={product.id} product={serializeProduct(product)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="container py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t("featured")}</h2>
            <Link href={`${prefix}/products?featured=true`} className="text-primary hover:underline text-sm">
              {t("viewAll")} <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={serializeProduct(product)} />
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newProducts.length > 0 && (
        <section className="container py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t("newArrivals")}</h2>
            <Link href={`${prefix}/products?sort=newest`} className="text-primary hover:underline text-sm">
              {t("viewAll")} <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={serializeProduct(product)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
