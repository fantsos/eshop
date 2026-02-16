"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export function OrderStatusUpdate({ orderId, currentStatus, currentPaymentStatus }: { orderId: string; currentStatus: string; currentPaymentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, paymentStatus, trackingNumber: trackingNumber || undefined }) });
      if (res.ok) { toast({ title: "Order updated" }); router.refresh(); }
      else toast({ title: "Error", variant: "destructive" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Order Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Payment Status</Label><Select value={paymentStatus} onValueChange={setPaymentStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["PENDING","PAID","FAILED","REFUNDED"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Tracking Number</Label><Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Enter tracking number" /></div>
      <Button onClick={handleUpdate} disabled={loading}>{loading ? "Updating..." : "Update Order"}</Button>
    </div>
  );
}
