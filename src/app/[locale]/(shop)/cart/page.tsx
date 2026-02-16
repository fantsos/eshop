"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export default function CartPage() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "el";
  const prefix = locale === "en" ? "/en" : "";

  const { items, updateQuantity, removeItem, getTotal } = useCartStore();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const subtotal = getTotal();
  const shipping = subtotal >= 50 ? 0 : 4.99;
  const total = subtotal - discount + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      const data = await res.json();
      if (res.ok) {
        setDiscount(data.discount);
        toast({ title: t("success"), description: `Coupon applied! -${formatPrice(data.discount, locale)}` });
      } else {
        toast({ title: t("error"), description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">{t("cart")}</h1>
        <p className="text-muted-foreground mb-4">
          {locale === "en" ? "Your cart is empty" : "Το καλάθι σας είναι άδειο"}
        </p>
        <Link href={`${prefix}/products`}>
          <Button>{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t("cart")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={`${item.productId}-${item.variantId || ""}`}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 rounded-md overflow-hidden bg-muted shrink-0">
                    <Image src={item.image || "/uploads/placeholder.png"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{item.name}</h3>
                    <p className="text-lg font-bold mt-1">{formatPrice(item.price, locale)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto text-destructive" onClick={() => removeItem(item.productId, item.variantId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(item.price * item.quantity, locale)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{locale === "en" ? "Order Summary" : "Σύνοψη Παραγγελίας"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>{t("subtotal")}</span>
              <span>{formatPrice(subtotal, locale)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{t("discount")}</span>
                <span>-{formatPrice(discount, locale)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{t("shipping")}</span>
              <span>{shipping === 0 ? t("freeShipping") : formatPrice(shipping, locale)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>{t("total")}</span>
              <span>{formatPrice(total, locale)}</span>
            </div>

            {/* Coupon */}
            <div className="flex gap-2">
              <Input placeholder={t("couponCode")} value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
              <Button variant="outline" onClick={handleApplyCoupon}>{t("applyCoupon")}</Button>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Link href={`${prefix}/checkout`} className="w-full">
              <Button className="w-full" size="lg">{t("checkout")}</Button>
            </Link>
            <Link href={`${prefix}/products`} className="w-full">
              <Button variant="outline" className="w-full">{t("continueShopping")}</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
