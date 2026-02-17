"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { CountdownTimer } from "@/components/product/countdown-timer";

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    nameEl: string;
    nameEn: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    avgRating: number;
    reviewCount: number;
    stock: number;
    brand?: string | null;
    flashSalePrice?: number | null;
    flashSaleEnd?: string | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "el";
  const prefix = locale === "en" ? "/en" : "";

  const name = locale === "en" ? product.nameEn : product.nameEl;
  const addToCart = useCartStore((s) => s.addItem);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  const isFlashSale = product.flashSalePrice && product.flashSaleEnd && new Date(product.flashSaleEnd) > new Date();
  const displayPrice = isFlashSale ? product.flashSalePrice! : product.price;
  const originalPrice = isFlashSale ? product.price : product.compareAtPrice;
  const discount = originalPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;
  const image = product.images[0] || "/uploads/placeholder.png";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock <= 0) return;
    addToCart({
      productId: product.id,
      name,
      price: displayPrice,
      image,
      quantity: 1,
      stock: product.stock,
    });
    toast({ title: t("addToCart"), description: name });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({ productId: product.id, name, price: displayPrice, image });
      toast({ title: t("addToWishlist"), description: name });
    }
  };

  return (
    <Link href={`${prefix}/product/${product.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          {discount > 0 && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              -{discount}%
            </Badge>
          )}
          {isFlashSale && (
            <Badge className="absolute top-2 right-2 bg-orange-500">
              {t("flashSale")}
            </Badge>
          )}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-lg">{t("outOfStock")}</Badge>
            </div>
          )}
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleToggleWishlist} aria-label={inWishlist ? t("removeFromWishlist") : t("addToWishlist")}>
              <Heart className={`h-4 w-4 ${inWishlist ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleAddToCart} disabled={product.stock <= 0} aria-label={t("addToCart")}>
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-3">
          {product.brand && (
            <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
          )}
          <h3 className="font-medium text-sm line-clamp-2 mb-1">{name}</h3>
          <div className="flex items-center gap-1 mb-1">
            {product.reviewCount > 0 && (
              <>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < Math.round(product.avgRating) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{formatPrice(displayPrice, locale)}</span>
            {originalPrice && originalPrice > displayPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice, locale)}
              </span>
            )}
          </div>
          {isFlashSale && product.flashSaleEnd && (
            <CountdownTimer endDate={product.flashSaleEnd} />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
