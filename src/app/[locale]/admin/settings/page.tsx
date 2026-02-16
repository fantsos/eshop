"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const DEFAULTS = {
  storeName: "E-Shop",
  storeEmail: "info@eshop.fantsos.gr",
  taxRate: 24,
  freeShippingThreshold: 50,
  defaultShippingRate: 4.99,
  codFee: 2.50,
  enableStripe: true,
  enablePaypal: true,
  enableBankTransfer: true,
  enableCOD: true,
  enableIRIS: true,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        setSettings({
          storeName: data.storeName || DEFAULTS.storeName,
          storeEmail: data.storeEmail || DEFAULTS.storeEmail,
          taxRate: data.taxRate ? parseFloat(data.taxRate) : DEFAULTS.taxRate,
          freeShippingThreshold: data.freeShippingThreshold ? parseFloat(data.freeShippingThreshold) : DEFAULTS.freeShippingThreshold,
          defaultShippingRate: data.defaultShippingRate ? parseFloat(data.defaultShippingRate) : DEFAULTS.defaultShippingRate,
          codFee: data.codFee ? parseFloat(data.codFee) : DEFAULTS.codFee,
          enableStripe: data.enableStripe !== "false",
          enablePaypal: data.enablePaypal !== "false",
          enableBankTransfer: data.enableBankTransfer !== "false",
          enableCOD: data.enableCOD !== "false",
          enableIRIS: data.enableIRIS !== "false",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    if (res.ok) toast({ title: "Settings saved" });
    else toast({ title: "Error", variant: "destructive" });
    setSaving(false);
  };

  if (loading) return <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading settings...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>Store Info</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="space-y-2"><Label>Store Name</Label><Input value={settings.storeName} onChange={e => setSettings({...settings, storeName: e.target.value})} /></div>
          <div className="space-y-2"><Label>Store Email</Label><Input value={settings.storeEmail} onChange={e => setSettings({...settings, storeEmail: e.target.value})} /></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Tax & Shipping</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Tax Rate (%)</Label><Input type="number" value={settings.taxRate} onChange={e => setSettings({...settings, taxRate: parseFloat(e.target.value) || 0})} /></div>
            <div className="space-y-2"><Label>Free Shipping Above (€)</Label><Input type="number" value={settings.freeShippingThreshold} onChange={e => setSettings({...settings, freeShippingThreshold: parseFloat(e.target.value) || 0})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Default Shipping Rate (€)</Label><Input type="number" step="0.01" value={settings.defaultShippingRate} onChange={e => setSettings({...settings, defaultShippingRate: parseFloat(e.target.value) || 0})} /></div>
            <div className="space-y-2"><Label>COD Fee (€)</Label><Input type="number" step="0.01" value={settings.codFee} onChange={e => setSettings({...settings, codFee: parseFloat(e.target.value) || 0})} /></div>
          </div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader><CardContent className="space-y-3">
          {[{ key: "enableStripe", label: "Credit/Debit Card (Stripe)" }, { key: "enablePaypal", label: "PayPal" }, { key: "enableBankTransfer", label: "Bank Transfer" }, { key: "enableCOD", label: "Cash on Delivery" }, { key: "enableIRIS", label: "IRIS" }].map(pm => (
            <div key={pm.key} className="flex items-center gap-2"><Checkbox checked={(settings as any)[pm.key]} onCheckedChange={v => setSettings({...settings, [pm.key]: !!v})} /><Label>{pm.label}</Label></div>
          ))}
        </CardContent></Card>
        <Button onClick={handleSave} size="lg" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
