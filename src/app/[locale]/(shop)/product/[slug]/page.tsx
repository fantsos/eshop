import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ProductActions } from "@/components/product/product-actions";
import { ImageGallery } from "@/components/product/image-gallery";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star } from "lucide-react";
import type { Metadata } from "next";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { TrackView } from "@/components/product/track-view";
import { RecentlyViewed } from "@/components/product/recently-viewed";

export async function generateMetadata({ params }: { params: { slug: string; locale: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) return {};
  const name = params.locale === "en" ? product.nameEn : product.nameEl;
  const desc = params.locale === "en" ? product.descriptionEn : product.descriptionEl;
  return {
    title: name,
    description: desc?.slice(0, 160),
    openGraph: { title: name, description: desc?.slice(0, 160), images: product.images[0] ? [product.images[0]] : [] },
  };
}

export default async function ProductPage({ params: { slug, locale } }: { params: { slug: string; locale: string } }) {
  const t = await getTranslations("common");
  const product = await prisma.product.findUnique({ where: { slug }, include: { category: true, variants: true, reviews: { include: { user: { select: { name: true, avatar: true } } }, orderBy: { createdAt: "desc" }, take: 10 } } });
  if (!product || !product.isActive) notFound();

  const similarProducts = await prisma.product.findMany({ where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } }, take: 4 });

  // "Customers also bought" - products bought by people who bought this product
  const alsoBought = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      orderItems: {
        some: {
          order: {
            items: { some: { productId: product.id } },
          },
        },
      },
    },
    take: 4,
    orderBy: { salesCount: "desc" },
  });

  const name = locale === "en" ? product.nameEn : product.nameEl;
  const description = locale === "en" ? product.descriptionEn : product.descriptionEl;
  const isFlashSale = product.flashSalePrice && product.flashSaleEnd && product.flashSaleEnd > new Date();
  const displayPrice = isFlashSale ? Number(product.flashSalePrice) : Number(product.price);
  const originalPrice = isFlashSale ? Number(product.price) : (product.compareAtPrice ? Number(product.compareAtPrice) : null);

  const serializeProduct = (p: any) => ({ ...p, price: Number(p.price), compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null, avgRating: Number(p.avgRating), flashSalePrice: p.flashSalePrice ? Number(p.flashSalePrice) : null, flashSaleEnd: p.flashSaleEnd ? p.flashSaleEnd.toISOString() : null, weight: p.weight ? Number(p.weight) : null });

  const baseUrl = process.env.NEXTAUTH_URL || "https://eshop.fantsos.gr";
  const categoryName = locale === "en" ? product.category?.nameEn : product.category?.nameEl;

  return (
    <div className="container py-8">
      <ProductJsonLd product={{ ...product, price: displayPrice, flashSalePrice: isFlashSale ? displayPrice : null, rating: Number(product.avgRating), reviewCount: product.reviewCount }} />
      <BreadcrumbJsonLd items={[
        { name: locale === "en" ? "Home" : "Αρχική", url: baseUrl },
        ...(product.category ? [{ name: categoryName || "", url: `${baseUrl}/category/${product.category.slug}` }] : []),
        { name, url: `${baseUrl}/product/${product.slug}` },
      ]} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <ImageGallery images={product.images} name={name} flashSaleLabel={isFlashSale ? t("flashSale") : undefined} />
        <div>
          {product.brand && <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>}
          <h1 className="text-3xl font-bold mb-2">{name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-5 w-5 ${i < Math.round(Number(product.avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />))}</div>
            <span className="text-sm text-muted-foreground">({product.reviewCount} {t("reviews")})</span>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-4xl font-bold">&euro;{displayPrice.toFixed(2)}</span>
            {originalPrice && originalPrice > displayPrice && (
              <><span className="text-xl text-muted-foreground line-through">&euro;{originalPrice.toFixed(2)}</span><Badge variant="destructive">-{Math.round((1 - displayPrice / originalPrice) * 100)}%</Badge></>
            )}
          </div>
          <div className="mb-6">
            {product.stock > 0 ? <Badge variant="success">{t("inStock")} ({product.stock})</Badge> : <Badge variant="destructive">{t("outOfStock")}</Badge>}
            {product.sku && <span className="text-xs text-muted-foreground ml-3">SKU: {product.sku}</span>}
          </div>
          <ProductActions product={{ id: product.id, name, price: displayPrice, stock: product.stock, image: product.images[0] || "", variants: product.variants.map(v => ({ id: v.id, name: v.name, price: Number(v.price), stock: v.stock, attributes: v.attributes as Record<string, string> })) }} />
        </div>
      </div>

      <Tabs defaultValue="description" className="mb-12">
        <TabsList>
          <TabsTrigger value="description">{t("description")}</TabsTrigger>
          <TabsTrigger value="specs">{t("specifications")}</TabsTrigger>
          <TabsTrigger value="reviews">{t("reviews")} ({product.reviewCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="prose max-w-none mt-4"><div dangerouslySetInnerHTML={{ __html: description || "" }} /></TabsContent>
        <TabsContent value="specs" className="mt-4">
          {product.specs && typeof product.specs === "object" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(product.specs as Record<string, string>).map(([key, value]) => (<div key={key} className="flex border-b py-2"><span className="font-medium w-1/3">{key}</span><span className="text-muted-foreground">{value}</span></div>))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="reviews" className="mt-4">
          <ProductReviews productId={product.id} reviews={product.reviews.map(r => ({ id: r.id, rating: r.rating, title: r.title, comment: r.comment, images: r.images, userName: r.user.name || "Anonymous", userAvatar: r.user.avatar, isVerified: r.isVerified, createdAt: r.createdAt.toISOString() }))} />
        </TabsContent>
      </Tabs>

      {similarProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">{t("similarProducts")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{similarProducts.map(p => <ProductCard key={p.id} product={serializeProduct(p)} />)}</div>
        </section>
      )}

      {alsoBought.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-4">{t("customersAlsoBought")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{alsoBought.map(p => <ProductCard key={p.id} product={serializeProduct(p)} />)}</div>
        </section>
      )}

      <TrackView product={{ id: product.id, name, slug: product.slug, price: displayPrice, image: product.images[0] || "" }} />
      <RecentlyViewed />
    </div>
  );
}
