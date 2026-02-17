"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Search } from "lucide-react";

const statusLabels: Record<string, { en: string; el: string; color: string }> = {
  PENDING: { en: "Pending", el: "Εκκρεμεί", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { en: "Confirmed", el: "Επιβεβαιώθηκε", color: "bg-blue-100 text-blue-800" },
  PROCESSING: { en: "Processing", el: "Επεξεργασία", color: "bg-indigo-100 text-indigo-800" },
  SHIPPED: { en: "Shipped", el: "Απεστάλη", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { en: "Delivered", el: "Παραδόθηκε", color: "bg-green-100 text-green-800" },
  CANCELLED: { en: "Cancelled", el: "Ακυρώθηκε", color: "bg-red-100 text-red-800" },
};

interface OrderResult {
  orderNumber: string;
  status: string;
  createdAt: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
}

export default function TrackOrderPage() {
  const pathname = usePathname();
  const isEn = pathname.startsWith("/en");
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`);
      if (res.ok) {
        setOrder(await res.json());
      } else {
        setError(isEn ? "Order not found. Please check your order number and email." : "Η παραγγελία δεν βρέθηκε. Ελέγξτε τον αριθμό παραγγελίας και το email σας.");
      }
    } catch {
      setError(isEn ? "An error occurred. Please try again." : "Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.");
    }
    setLoading(false);
  };

  const sl = (s: string) => {
    const l = statusLabels[s];
    return l ? (isEn ? l.en : l.el) : s;
  };

  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">{isEn ? "Track Your Order" : "Παρακολούθηση Παραγγελίας"}</h1>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />{isEn ? "Find your order" : "Βρείτε την παραγγελία σας"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label>{isEn ? "Order Number" : "Αριθμός Παραγγελίας"}</Label>
              <Input placeholder={isEn ? "e.g. ORD-20260216-ABC12" : "π.χ. ORD-20260216-ABC12"} value={orderNumber} onChange={e => setOrderNumber(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder={isEn ? "Email used for the order" : "Email που χρησιμοποιήθηκε"} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEn ? "Track Order" : "Αναζήτηση"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <p className="mt-4 text-center text-destructive">{error}</p>}

      {order && (
        <Card className="mt-6">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span className="font-semibold">{order.orderNumber}</span>
              </div>
              <Badge className={statusLabels[order.status]?.color || ""}>{sl(order.status)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isEn ? "Placed on" : "Ημερομηνία"}: {new Date(order.createdAt).toLocaleDateString(isEn ? "en-GB" : "el-GR")}
            </p>
            <div className="border-t pt-4 space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span>€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>{isEn ? "Total" : "Σύνολο"}</span>
                <span>€{order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
