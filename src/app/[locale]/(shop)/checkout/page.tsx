"use client";

import { useState, useEffect, useRef, lazy, Suspense } from "react";
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
import { Check, CreditCard, Building2, Banknote, Loader2, X, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const StripeCardForm = lazy(() => import("@/components/checkout/stripe-card-form"));
const PayPalButton = lazy(() => import("@/components/checkout/paypal-button"));

type Step = "address" | "shipping" | "payment" | "review";

const COURIER_METHODS = [
  { id: "ELTA",   name: "ΕΛΤΑ Courier",         logo: "/couriers/elta.png",    price: 4 },
  { id: "ACS",    name: "ACS Courier",           logo: "/couriers/acs.png",     price: 4 },
  { id: "GENIKI", name: "Γενική Ταχυδρομική",   logo: "/couriers/geniki.svg",  price: 4 },
  { id: "BOXNOW", name: "BoxNow (Locker)",       logo: "/couriers/boxnow.svg",  price: 2 },
];

const PAYMENT_METHODS = [
  { id: "STRIPE",        icon: CreditCard,  labelKey: "creditCard" as const },
  { id: "PAYPAL",        icon: CreditCard,  labelKey: "paypal" as const },
  { id: "BANK_TRANSFER", icon: Building2,   labelKey: "bankTransfer" as const },
  { id: "COD",           icon: Banknote,    labelKey: "cod" as const },
  { id: "IRIS",          icon: Building2,   labelKey: "iris" as const },
];

interface BoxnowLocker {
  id: string;
  name: string;
  address: string;
  postalCode: string;
}

interface ShopSettings {
  taxRate: number;
  freeShippingThreshold: number;
  defaultShippingRate: number;
  codFee: number;
  boxnowPartnerId: number;
}

const DEFAULT_SETTINGS: ShopSettings = {
  taxRate: 24,
  freeShippingThreshold: 50,
  defaultShippingRate: 4,
  codFee: 2,
  boxnowPartnerId: 0,
};

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
  const [guestEmail, setGuestEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("STRIPE");
  const [courierMethod, setCourierMethod] = useState("ELTA");
  const [boxnowLocker, setBoxnowLocker] = useState<BoxnowLocker | null>(null);
  const boxnowScriptLoaded = useRef(false);

  // Settings from API
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);

  // Load settings on mount
  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.ok ? res.json() : {})
      .then((data: Record<string, string>) => {
        setSettings({
          taxRate: data.taxRate ? parseFloat(data.taxRate) : DEFAULT_SETTINGS.taxRate,
          freeShippingThreshold: data.freeShippingThreshold ? parseFloat(data.freeShippingThreshold) : DEFAULT_SETTINGS.freeShippingThreshold,
          defaultShippingRate: data.defaultShippingRate ? parseFloat(data.defaultShippingRate) : DEFAULT_SETTINGS.defaultShippingRate,
          codFee: data.codFee ? parseFloat(data.codFee) : DEFAULT_SETTINGS.codFee,
          boxnowPartnerId: data.boxnowPartnerId ? parseInt(data.boxnowPartnerId) : DEFAULT_SETTINGS.boxnowPartnerId,
        });
      })
      .catch(() => {});
  }, []);

  // BoxNow widget setup – runs whenever BoxNow is selected or settings load
  useEffect(() => {
    if (courierMethod !== "BOXNOW") return;
    if (!settings.boxnowPartnerId) return; // not configured yet

    // Update global config so the callback always has fresh React state
    (window as any)._bn_map_widget_config = {
      type: "popup",
      partnerId: settings.boxnowPartnerId,
      parentElement: "#boxnow-map-container",
      gps: "yes",
      afterSelect: (selected: any) => {
        setBoxnowLocker({
          id: selected.boxnowLockerId,
          name: selected.boxnowLockerName || selected.boxnowLockerAddressLine1,
          address: selected.boxnowLockerAddressLine1,
          postalCode: selected.boxnowLockerPostalCode,
        });
      },
    };

    // Load script once
    if (!boxnowScriptLoaded.current) {
      boxnowScriptLoaded.current = true;
      const script = document.createElement("script");
      script.id = "boxnow-widget-script";
      script.src = "https://widget-cdn.boxnow.gr/map-widget/client/v5.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, [courierMethod, settings.boxnowPartnerId]);

  const subtotal = getTotal();
  const selectedCourier = COURIER_METHODS.find(c => c.id === courierMethod) || COURIER_METHODS[0];
  const codFee = paymentMethod === "COD" ? settings.codFee : 0;
  const shipping = subtotal >= settings.freeShippingThreshold ? 0 : selectedCourier.price;
  const tax = Math.round(subtotal * (settings.taxRate / 100) * 100) / 100;
  const discount = couponDiscount;
  const total = Math.round((subtotal + shipping + tax + codFee - discount) * 100) / 100;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponApplying(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      const data = await res.json();
      if (res.ok) {
        setCouponDiscount(data.discount);
        setCouponApplied(true);
        toast({ title: tc("success"), description: `${tc("discount")}: -${formatPrice(data.discount, locale)}` });
      } else {
        toast({ title: tc("error"), description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: tc("error"), variant: "destructive" });
    }
    setCouponApplying(false);
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setCouponApplied(false);
  };

  const handleShippingNext = () => {
    if (courierMethod === "BOXNOW" && settings.boxnowPartnerId && !boxnowLocker) {
      toast({
        title: locale === "en" ? "Select a locker" : "Επιλέξτε locker",
        description: locale === "en" ? "Please select a BoxNow locker to continue." : "Παρακαλώ επιλέξτε locker BoxNow για να συνεχίσετε.",
        variant: "destructive",
      });
      return;
    }
    setStep("payment");
  };

  if (status === "loading") return <div className="container py-16 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  if (items.length === 0) return (<div className="container py-16 text-center"><h1 className="text-2xl font-bold mb-4">{t("title")}</h1><Link href={`${prefix}/products`}><Button>{tc("continueShopping")}</Button></Link></div>);

  const isGuest = status === "unauthenticated";

  const placeOrder = async (paymentId?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity, price: i.price, name: i.name })),
          shippingAddress: address,
          paymentMethod,
          courierMethod,
          boxnowLockerId: boxnowLocker?.id,
          boxnowLockerName: boxnowLocker?.name,
          boxnowLockerAddress: boxnowLocker?.address,
          subtotal,
          shipping,
          tax,
          discount,
          couponCode: couponApplied ? couponCode.trim() : undefined,
          codFee,
          total,
          paymentId,
          guestEmail: isGuest ? guestEmail : undefined,
        }),
      });
      if (res.ok) { const data = await res.json(); clearCart(); router.push(`${prefix}/orders/${data.orderNumber}?success=true`); }
      else { const data = await res.json(); toast({ title: tc("error"), description: data.error, variant: "destructive" }); }
    } catch { toast({ title: tc("error"), variant: "destructive" }); }
    setLoading(false);
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === "STRIPE" || paymentMethod === "PAYPAL") return;
    await placeOrder();
  };

  const steps: Step[] = ["address", "shipping", "payment", "review"];

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8 gap-4">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === s ? "bg-primary text-primary-foreground" : steps.indexOf(step) > i ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
              {steps.indexOf(step) > i ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:inline ${step === s ? "font-bold" : "text-muted-foreground"}`}>{t(`step${i + 1}` as any)}</span>
            {i < 3 && <div className="w-8 sm:w-12 h-px bg-border" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">

          {/* ── STEP 1: Address ── */}
          {step === "address" && (
            <Card><CardHeader><CardTitle>{t("shippingAddress")}</CardTitle></CardHeader><CardContent className="space-y-4">
              {isGuest && (
                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{locale === "en" ? "Checking out as guest" : "Αγορά ως επισκέπτης"}</p>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="email@example.com" required />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <Link href={`${prefix}/auth/login?callbackUrl=${encodeURIComponent(pathname)}`} className="text-primary hover:underline">
                      {locale === "en" ? "Sign in for a better experience" : "Συνδεθείτε για καλύτερη εμπειρία"}
                    </Link>
                  </p>
                </div>
              )}
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
              <Button onClick={() => {
                if (!address.name || !address.street || !address.city || !address.zip) { toast({ title: tc("error"), description: locale === "en" ? "Fill all required fields" : "Συμπληρώστε όλα τα υποχρεωτικά πεδία", variant: "destructive" }); return; }
                if (isGuest && !guestEmail) { toast({ title: tc("error"), description: locale === "en" ? "Email is required" : "Το email είναι υποχρεωτικό", variant: "destructive" }); return; }
                setStep("shipping");
              }}>{tc("next")}</Button>
            </CardContent></Card>
          )}

          {/* ── STEP 2: Shipping method ── */}
          {step === "shipping" && (
            <Card>
              <CardHeader><CardTitle>{locale === "en" ? "Shipping Method" : "Τρόπος αποστολής"}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {COURIER_METHODS.filter(c => c.id !== "BOXNOW" || !!settings.boxnowPartnerId).map(courier => (
                  <button
                    key={courier.id}
                    onClick={() => { setCourierMethod(courier.id); if (courier.id !== "BOXNOW") setBoxnowLocker(null); }}
                    className={`flex items-center gap-4 w-full p-4 rounded-lg border-2 transition-colors ${courierMethod === courier.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                  >
                    <div className="relative h-10 w-28 flex-shrink-0 bg-white rounded border flex items-center justify-center p-1">
                      <Image src={courier.logo} alt={courier.name} fill className="object-contain p-1" unoptimized />
                    </div>
                    <span className="font-medium flex-1 text-left">{courier.name}</span>
                    <Badge variant={courierMethod === courier.id ? "default" : "outline"} className="ml-auto shrink-0">
                      {subtotal >= settings.freeShippingThreshold ? tc("freeShipping") : formatPrice(courier.price, locale)}
                    </Badge>
                  </button>
                ))}

                {/* BoxNow locker picker – shown only when BoxNow is selected */}
                {courierMethod === "BOXNOW" && (
                  <div className="mt-2 p-4 rounded-lg bg-muted/60 border space-y-3">
                    <p className="text-sm font-medium">{locale === "en" ? "Select a BoxNow locker" : "Επιλέξτε locker BoxNow"}</p>

                    {boxnowLocker ? (
                      /* Selected locker info */
                      <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{boxnowLocker.name}</p>
                          <p className="text-xs text-muted-foreground">{boxnowLocker.address}, {boxnowLocker.postalCode}</p>
                        </div>
                        {/* Hidden container required by widget */}
                        <div id="boxnow-map-container" />
                        {/* Trigger to re-open picker */}
                        <a href="javascript:;" className="boxnow-widget-button shrink-0">
                          <Button variant="ghost" size="sm" type="button">
                            {locale === "en" ? "Change" : "Αλλαγή"}
                          </Button>
                        </a>
                      </div>
                    ) : settings.boxnowPartnerId ? (
                      /* Partner ID configured – show picker button */
                      <div className="flex flex-col items-center gap-3">
                        <div id="boxnow-map-container" />
                        <a href="javascript:;" className="boxnow-widget-button">
                          <Button variant="outline" type="button" className="gap-2">
                            <MapPin className="h-4 w-4" />
                            {locale === "en" ? "Choose locker on map" : "Επιλογή locker από χάρτη"}
                          </Button>
                        </a>
                        <p className="text-xs text-muted-foreground text-center">
                          {locale === "en"
                            ? "Click to open the interactive map and select the nearest locker."
                            : "Κάντε κλικ για να ανοίξετε τον χάρτη και επιλέξτε το κοντινότερο locker."}
                        </p>
                      </div>
                    ) : (
                      /* Partner ID NOT configured – admin notice */
                      <div className="text-sm text-muted-foreground p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                        {locale === "en"
                          ? "BoxNow integration is not yet configured. Please contact the store administrator."
                          : "Η σύνδεση με BoxNow δεν έχει ρυθμιστεί ακόμα. Επικοινωνήστε με τον διαχειριστή."}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setStep("address")}>{tc("back")}</Button>
                  <Button onClick={handleShippingNext}>{tc("next")}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── STEP 3: Payment ── */}
          {step === "payment" && (
            <Card><CardHeader><CardTitle>{t("paymentMethod")}</CardTitle></CardHeader><CardContent className="space-y-3">
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.id} onClick={() => setPaymentMethod(pm.id)} className={`flex items-center gap-3 w-full p-4 rounded-lg border transition-colors ${paymentMethod === pm.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                  <pm.icon className="h-5 w-5" /><span className="font-medium">{t(pm.labelKey)}</span>
                  {pm.id === "COD" && <Badge variant="outline" className="ml-auto">+{formatPrice(settings.codFee, locale)}</Badge>}
                </button>
              ))}
              {paymentMethod === "BANK_TRANSFER" && <p className="text-sm text-muted-foreground p-3 bg-muted rounded">{t("bankTransferInfo")}</p>}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setStep("shipping")}>{tc("back")}</Button>
                <Button onClick={() => setStep("review")}>{tc("next")}</Button>
              </div>
            </CardContent></Card>
          )}

          {/* ── STEP 4: Review ── */}
          {step === "review" && (
            <Card><CardHeader><CardTitle>{t("step4")}</CardTitle></CardHeader><CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">{t("shippingAddress")}</h3>
                <p className="text-sm text-muted-foreground">{address.name}<br />{address.street}<br />{address.city}, {address.state} {address.zip}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">{locale === "en" ? "Shipping" : "Μεταφορική"}</h3>
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-20 bg-white rounded border flex items-center justify-center">
                    <Image src={selectedCourier.logo} alt={selectedCourier.name} fill className="object-contain p-1" unoptimized />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{selectedCourier.name}</p>
                    {boxnowLocker && (
                      <p className="text-xs text-muted-foreground">{boxnowLocker.name} — {boxnowLocker.address}</p>
                    )}
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">{t("paymentMethod")}</h3>
                <p className="text-sm text-muted-foreground">{t(PAYMENT_METHODS.find(p => p.id === paymentMethod)?.labelKey || "creditCard")}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">{tc("products")}</h3>
                {items.map(item => (
                  <div key={`${item.productId}-${item.variantId || ""}`} className="flex items-center gap-3 py-2">
                    <div className="relative h-12 w-12 rounded bg-muted overflow-hidden">
                      <Image src={item.image || "/uploads/placeholder.png"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1"><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">x{item.quantity}</p></div>
                    <p className="font-medium">{formatPrice(item.price * item.quantity, locale)}</p>
                  </div>
                ))}
              </div>
              <Separator />
              {paymentMethod === "STRIPE" && (
                <div className="space-y-2">
                  <h3 className="font-medium">{t("creditCard")}</h3>
                  <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin" />}>
                    <StripeCardForm amount={total} onSuccess={(paymentId) => placeOrder(paymentId)} onError={(msg) => toast({ title: tc("error"), description: msg, variant: "destructive" })} />
                  </Suspense>
                </div>
              )}
              {paymentMethod === "PAYPAL" && (
                <div className="space-y-2">
                  <h3 className="font-medium">PayPal</h3>
                  <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin" />}>
                    <PayPalButton amount={total} onSuccess={(paymentId) => placeOrder(paymentId)} onError={(msg) => toast({ title: tc("error"), description: msg, variant: "destructive" })} />
                  </Suspense>
                </div>
              )}
              {paymentMethod !== "STRIPE" && paymentMethod !== "PAYPAL" && (
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setStep("payment")}>{tc("back")}</Button>
                  <Button onClick={handlePlaceOrder} disabled={loading} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("placeOrder")}
                  </Button>
                </div>
              )}
              {(paymentMethod === "STRIPE" || paymentMethod === "PAYPAL") && (
                <Button variant="outline" onClick={() => setStep("payment")} className="mt-2">{tc("back")}</Button>
              )}
            </CardContent></Card>
          )}
        </div>

        {/* ── Order Summary sidebar ── */}
        <Card className="h-fit">
          <CardHeader><CardTitle>{locale === "en" ? "Order Summary" : "Σύνοψη"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span>{tc("subtotal")}</span><span>{formatPrice(subtotal, locale)}</span></div>
            <div className="flex justify-between text-sm"><span>{tc("shipping")}</span><span>{shipping === 0 ? tc("freeShipping") : formatPrice(shipping, locale)}</span></div>
            <div className="flex justify-between text-sm"><span>{tc("tax")} ({settings.taxRate}%)</span><span>{formatPrice(tax, locale)}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>{tc("discount")}</span><span>-{formatPrice(discount, locale)}</span></div>}
            {codFee > 0 && <div className="flex justify-between text-sm"><span>{t("codFee")}</span><span>{formatPrice(codFee, locale)}</span></div>}
            <Separator />
            <div className="flex justify-between font-bold"><span>{tc("total")}</span><span>{formatPrice(total, locale)}</span></div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm">{tc("couponCode")}</Label>
              {couponApplied ? (
                <Badge variant="secondary" className="flex-1 justify-between py-1.5 w-full">
                  <span>{couponCode}</span>
                  <button onClick={handleRemoveCoupon} className="ml-2 hover:text-destructive"><X className="h-3 w-3" /></button>
                </Badge>
              ) : (
                <div className="flex gap-2">
                  <Input placeholder={tc("couponCode")} value={couponCode} onChange={e => setCouponCode(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleApplyCoupon(); }} className="text-sm" />
                  <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={couponApplying || !couponCode.trim()} className="shrink-0">
                    {couponApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : tc("applyCoupon")}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
