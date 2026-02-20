import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { ArrowRight, Truck, Shield, Headphones, CreditCard } from "lucide-react";
import { OrganizationJsonLd } from "@/components/seo/json-ld";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  const baseUrl = process.env.NEXTAUTH_URL || "https://fantsos.gr";
  const title = t("meta.homeTitle");
  const description = t("meta.homeDescription");
  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: "E-Shop",
      locale: locale === "el" ? "el_GR" : "en_US",
      type: "website",
      images: [{ url: `${baseUrl}/logo.png`, alt: "E-Shop" }],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        el: `${baseUrl}/el`,
        en: `${baseUrl}/en`,
      },
    },
  };
}

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("common");
  const prefix = locale === "en" ? "/en" : "";

  const [newProducts, flashSaleProducts] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
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
      {/* Features */}
      <section className="border-y bg-muted/30">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{t("freeShipping")}</p>
                <p className="text-xs text-muted-foreground">{t("freeShippingOver")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{t("securePayment")}</p>
                <p className="text-xs text-muted-foreground">{t("sslEncrypted")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Headphones className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{t("support247")}</p>
                <p className="text-xs text-muted-foreground">{t("alwaysHereToHelp")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{t("easyReturns")}</p>
                <p className="text-xs text-muted-foreground">{t("returnPolicy30")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

    </div>
  );
}
