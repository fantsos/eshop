"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Plus, Ticket } from "lucide-react";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", type: "PERCENTAGE", value: 0, minOrder: 0, maxUses: 0, expiresAt: "" });

  useEffect(() => { fetch("/api/admin/coupons").then(r => r.json()).then(setCoupons).catch(() => {}); }, []);

  const handleCreate = async () => {
    const res = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, minOrder: form.minOrder || null, maxUses: form.maxUses || null, expiresAt: form.expiresAt || null }) });
    if (res.ok) { toast({ title: "Coupon created" }); setOpen(false); fetch("/api/admin/coupons").then(r => r.json()).then(setCoupons); }
    else { const data = await res.json(); toast({ title: "Error", description: data.error, variant: "destructive" }); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><h1 className="text-3xl font-bold">Coupons</h1><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Coupon</Button></div>
      <Card><CardContent className="p-0">
        <table className="w-full">
          <thead><tr className="border-b"><th className="text-left p-3 text-sm font-medium">Code</th><th className="text-left p-3 text-sm font-medium">Discount</th><th className="text-left p-3 text-sm font-medium">Min Order</th><th className="text-left p-3 text-sm font-medium">Usage</th><th className="text-left p-3 text-sm font-medium">Expires</th><th className="text-left p-3 text-sm font-medium">Status</th></tr></thead>
          <tbody>{coupons.map((c: any) => (
            <tr key={c.id} className="border-b hover:bg-muted/50">
              <td className="p-3"><div className="flex items-center gap-2"><Ticket className="h-4 w-4" /><code className="font-bold">{c.code}</code></div></td>
              <td className="p-3 text-sm">{c.type === "PERCENTAGE" ? `${Number(c.value)}%` : `€${Number(c.value).toFixed(2)}`}</td>
              <td className="p-3 text-sm">{c.minOrder ? `€${Number(c.minOrder).toFixed(2)}` : "-"}</td>
              <td className="p-3 text-sm">{c.usedCount}/{c.maxUses || "∞"}</td>
              <td className="p-3 text-sm">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}</td>
              <td className="p-3"><Badge variant={c.isActive ? "success" as any : "secondary"}>{c.isActive ? "Active" : "Inactive"}</Badge></td>
            </tr>
          ))}</tbody>
        </table>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Add Coupon</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Type</Label><Select value={form.type} onValueChange={v => setForm({...form, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PERCENTAGE">Percentage</SelectItem><SelectItem value="FIXED">Fixed Amount</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Value</Label><Input type="number" value={form.value} onChange={e => setForm({...form, value: parseFloat(e.target.value) || 0})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Min Order (€)</Label><Input type="number" value={form.minOrder} onChange={e => setForm({...form, minOrder: parseFloat(e.target.value) || 0})} /></div>
            <div className="space-y-2"><Label>Max Uses</Label><Input type="number" value={form.maxUses} onChange={e => setForm({...form, maxUses: parseInt(e.target.value) || 0})} /></div>
          </div>
          <div className="space-y-2"><Label>Expires At</Label><Input type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} /></div>
          <Button onClick={handleCreate} className="w-full">Create Coupon</Button>
        </div>
      </DialogContent></Dialog>
    </div>
  );
}
