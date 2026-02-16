"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { toast } from "@/components/ui/use-toast";

interface Variant { id: string; name: string; price: number; stock: number; attributes: Record<string, string>; }

interface ProductActionsProps {
  product: { id: string; name: string; price: number; stock: number; image: string; variants: Variant[]; };
}

export function ProductActions({ product }: ProductActionsProps) {
  const t = useTranslations("common");
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const addToCart = useCartStore(s => s.addItem);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  const handleAddToCart = () => {
    if (currentStock <= 0) return;
    if (product.variants.length > 0 && !selectedVariant) {
      toast({ title: "Please select a variant", variant: "destructive" });
      return;
    }
    addToCart({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
      price: currentPrice, image: product.image, quantity, stock: currentStock,
    });
    toast({ title: t("addToCart"), description: product.name });
  };

  const handleToggleWishlist = () => {
    if (inWishlist) { removeFromWishlist(product.id); }
    else { addToWishlist({ productId: product.id, name: product.name, price: currentPrice, image: product.image }); toast({ title: t("addToWishlist") }); }
  };

  return (
    <div className="space-y-4">
      {product.variants.length > 0 && (
        <div>
          <p className="font-medium mb-2">Options:</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map(v => (
              <Button key={v.id} variant={selectedVariant?.id === v.id ? "default" : "outline"} size="sm" onClick={() => setSelectedVariant(v)} disabled={v.stock <= 0}>
                {v.name} {v.stock <= 0 ? `(${t("outOfStock")})` : ""}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="font-medium mb-2">{t("quantity")}:</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="h-4 w-4" /></Button>
          <Input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(currentStock, parseInt(e.target.value) || 1)))} className="w-20 text-center" min={1} max={currentStock} />
          <Button variant="outline" size="icon" onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="flex gap-3">
        <Button className="flex-1" size="lg" onClick={handleAddToCart} disabled={currentStock <= 0}>
          <ShoppingCart className="mr-2 h-5 w-5" /> {t("addToCart")}
        </Button>
        <Button variant="outline" size="lg" onClick={handleToggleWishlist}>
          <Heart className={`h-5 w-5 ${inWishlist ? "fill-red-500 text-red-500" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
