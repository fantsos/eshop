"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit } from "lucide-react";

interface Zone { id: string; name: string; regions: string[]; rate: number; freeAbove: number | null; }

export default function ShippingZonesPage() {
  const { toast } = useToast();
  const [zones, setZones] = useState<Zone[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", regions: "", rate: "", freeAbove: "" });

  useEffect(() => { fetchZones(); }, []);

  async function fetchZones() {
    const res = await fetch("/api/admin/shipping");
    setZones(await res.json());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name: form.name,
      regions: form.regions.split(",").map(r => r.trim()).filter(Boolean),
      rate: parseFloat(form.rate),
      freeAbove: form.freeAbove ? parseFloat(form.freeAbove) : null,
    };
    const url = editId ? `/api/admin/shipping/${editId}` : "/api/admin/shipping";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) {
      toast({ title: editId ? "Zone updated" : "Zone created" });
      setOpen(false);
      resetForm();
      fetchZones();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this shipping zone?")) return;
    await fetch(`/api/admin/shipping/${id}`, { method: "DELETE" });
    fetchZones();
  }

  function resetForm() { setForm({ name: "", regions: "", rate: "", freeAbove: "" }); setEditId(null); }
  function openEdit(z: Zone) {
    setForm({ name: z.name, regions: z.regions.join(", "), rate: String(z.rate), freeAbove: z.freeAbove ? String(z.freeAbove) : "" });
    setEditId(z.id);
    setOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Shipping Zones</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Zone</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit Zone" : "New Shipping Zone"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Zone Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Athens Area" required />
              </div>
              <div className="space-y-2">
                <Label>ZIP Prefixes (comma-separated, * for all)</Label>
                <Input value={form.regions} onChange={e => setForm({ ...form, regions: e.target.value })} placeholder="e.g. 10, 11, 12, 13" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rate (&euro;)</Label>
                  <Input type="number" step="0.01" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Free above (&euro;)</Label>
                  <Input type="number" step="0.01" value={form.freeAbove} onChange={e => setForm({ ...form, freeAbove: e.target.value })} placeholder="Optional" />
                </div>
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {zones.map(z => (
          <Card key={z.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium">{z.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Regions: {z.regions.join(", ")} | Rate: &euro;{z.rate.toFixed(2)}
                  {z.freeAbove && <> | Free above &euro;{z.freeAbove.toFixed(2)}</>}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(z)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(z.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {zones.length === 0 && <p className="text-center text-muted-foreground py-8">No shipping zones configured.</p>}
      </div>
    </div>
  );
}
