"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Check, CreditCard, Building2, Banknote, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Step = "address" | "payment" | "review";
const PAYMENT_METHODS = [
  { id: "STRIPE", icon: CreditCard, labelKey: "creditCard" as const },
  { id: "PAYPAL", icon: CreditCard, labelKey: "paypal" as const },
  { id: "BANK_TRANSFER", icon: Building2, labelKey: "bankTransfer" as const },
  { id: "COD", icon: Banknote, labelKey: "cod" as const },
  { id: "IRIS", icon: Building2, labelKey: "iris" as const },
];

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "el";
  const prefix = locale === "en" ? "/en" : "";
  const { items, getTotal, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>("address");
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({ name: "", street: "", city: "", state: "", zip: "", country: "GR", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState("STRIPE");

  const subtotal = getTotal();
  const codFee = paymentMethod === "COD" ? 2.5 : 0;
  const shipping = subtotal >= 50 ? 0 : 4.99;
  const total = subtotal + shipping + codFee;

  if (status === "unauthenticated") { router.push(`${prefix}/auth/login?callbackUrl=${encodeURIComponent(pathname)}`); return null; }
  if (items.length === 0) return (<div className="container py-16 text-center"><h1 className="text-2xl font-bold mb-4">{t("title")}</h1><Link href={`${prefix}/products`}><Button>{tc("continueShopping")}</Button></Link></div>);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity, price: i.price, name: i.name })), shippingAddress: address, paymentMethod, subtotal, shipping, codFee, total }) });
      if (res.ok) { const data = await res.json(); clearCart(); router.push(`${prefix}/orders/${data.orderNumber}?success=true`); }
      else { const data = await res.json(); toast({ title: tc("error"), description: data.error, variant: "destructive" }); }
    } catch { toast({ title: tc("error"), variant: "destructive" }); }
    setLoading(false);
  };

  const steps: Step[] = ["address", "payment", "review"];

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      <div className="flex items-center justify-center mb-8 gap-4">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === s ? "bg-primary text-primary-foreground" : steps.indexOf(step) > i ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
              {steps.indexOf(step) > i ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm ${step === s ? "font-bold" : "text-muted-foreground"}`}>{t(`step${i + 1}` as any)}</span>
            {i < 2 && <div className="w-12 h-px bg-border" />}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === "address" && (
            <Card><CardHeader><CardTitle>{t("shippingAddress")}</CardTitle></CardHeader><CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t("fullName")}</Label><Input value={address.name} onChange={e => setAddress({...address, name: e.target.value})} required /></div>
                <div className="space-y-2"><Label>{tc("phone")}</Label><Input value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>{t("street")}</Label><Input value={address.street} onChange={e => setAddress({...address, street: e.target.value})} required /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>{t("city")}</Label><Input value={address.city} onChange={e => setAddress({...address, city: e.target.value})} required /></div>
                <div className="space-y-2"><Label>{t("state")}</Label><Input value={address.state} onChange={e => setAddress({...address, state: e.target.value})} /></div>
                <div className="space-y-2"><Label>{t("zip")}</Label><Input value={address.zip} onChange={e => setAddress({...address, zip: e.target.value})} required /></div>
              </div>
              <Button onClick={() => { if (!address.name || !address.street || !address.city || !address.zip) { toast({ title: tc("error"), description: "Fill all required fields", variant: "destructive" }); return; } setStep("payment"); }}>{tc("next")}</Button>
            </CardContent></Card>
          )}
          {step === "payment" && (
            <Card><CardHeader><CardTitle>{t("paymentMethod")}</CardTitle></CardHeader><CardContent className="space-y-3">
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.id} onClick={() => setPaymentMethod(pm.id)} className={`flex items-center gap-3 w-full p-4 rounded-lg border transition-colors ${paymentMethod === pm.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                  <pm.icon className="h-5 w-5" /><span className="font-medium">{t(pm.labelKey)}</span>
                  {pm.id === "COD" && <Badge variant="outline" className="ml-auto">+&euro;2.50</Badge>}
                </button>
              ))}
              {paymentMethod === "BANK_TRANSFER" && <p className="text-sm text-muted-foreground p-3 bg-muted rounded">{t("bankTransferInfo")}</p>}
              <div className="flex gap-2 mt-4"><Button variant="outline" onClick={() => setStep("address")}>{tc("back")}</Button><Button onClick={() => setStep("review")}>{tc("next")}</Button></div>
            </CardContent></Card>
          )}
          {step === "review" && (
            <Card><CardHeader><CardTitle>{t("step4")}</CardTitle></CardHeader><CardContent className="space-y-4">
              <div><h3 className="font-medium mb-2">{t("shippingAddress")}</h3><p className="text-sm text-muted-foreground">{address.name}<br />{address.street}<br />{address.city}, {address.state} {address.zip}</p></div>
              <Separator />
              <div><h3 className="font-medium mb-2">{t("paymentMethod")}</h3><p className="text-sm text-muted-foreground">{t(PAYMENT_METHODS.find(p => p.id === paymentMethod)?.labelKey || "creditCard")}</p></div>
              <Separator />
              <div><h3 className="font-medium mb-2">{tc("products")}</h3>
                {items.map(item => (<div key={`${item.productId}-${item.variantId || ""}`} className="flex items-center gap-3 py-2"><div className="relative h-12 w-12 rounded bg-muted overflow-hidden"><Image src={item.image || "/uploads/placeholder.png"} alt={item.name} fill className="object-cover" /></div><div className="flex-1"><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">x{item.quantity}</p></div><p className="font-medium">{formatPrice(item.price * item.quantity, locale)}</p></div>))}
              </div>
              <div className="flex gap-2 mt-4"><Button variant="outline" onClick={() => setStep("payment")}>{tc("back")}</Button><Button onClick={handlePlaceOrder} disabled={loading} className="flex-1">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("placeOrder")}</Button></div>
            </CardContent></Card>
          )}
        </div>
        <Card className="h-fit"><CardHeader><CardTitle>{locale === "en" ? "Order Summary" : "Σύνοψη"}</CardTitle></CardHeader><CardContent className="space-y-3">
          <div className="flex justify-between text-sm"><span>{tc("subtotal")}</span><span>{formatPrice(subtotal, locale)}</span></div>
          <div className="flex justify-between text-sm"><span>{tc("shipping")}</span><span>{shipping === 0 ? tc("freeShipping") : formatPrice(shipping, locale)}</span></div>
          {codFee > 0 && <div className="flex justify-between text-sm"><span>{t("codFee")}</span><span>{formatPrice(codFee, locale)}</span></div>}
          <Separator /><div className="flex justify-between font-bold"><span>{tc("total")}</span><span>{formatPrice(total, locale)}</span></div>
        </CardContent></Card>
      </div>
    </div>
  );
}
