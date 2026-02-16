"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

export default function WishlistPage() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "el";
  const prefix = locale === "en" ? "/en" : "";

  const { items, removeItem } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addItem);

  const handleMoveToCart = (item: typeof items[0]) => {
    addToCart({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      stock: 99,
    });
    removeItem(item.productId);
    toast({ title: t("addToCart"), description: item.name });
  };

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">{t("wishlist")}</h1>
        <p className="text-muted-foreground mb-4">
          {locale === "en" ? "Your wishlist is empty" : "Τα αγαπημένα σας είναι άδεια"}
        </p>
        <Link href={`${prefix}/products`}>
          <Button>{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t("wishlist")} ({items.length})</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <Card key={item.productId} className="overflow-hidden">
            <div className="relative aspect-square bg-muted">
              <Image src={item.image || "/uploads/placeholder.png"} alt={item.name} fill className="object-cover" />
            </div>
            <CardContent className="p-3">
              <h3 className="font-medium text-sm line-clamp-2 mb-1">{item.name}</h3>
              <p className="font-bold mb-2">{formatPrice(item.price, locale)}</p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => handleMoveToCart(item)}>
                  <ShoppingCart className="h-3 w-3 mr-1" /> {t("addToCart")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => removeItem(item.productId)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
