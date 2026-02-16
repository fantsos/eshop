"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

const emptyAddress = { name: "", street: "", city: "", state: "", zip: "", country: "GR", phone: "" };

export default function AddressesPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(emptyAddress);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) fetchAddresses();
  }, [session]);

  if (status === "unauthenticated") redirect("/auth/login");
  if (status === "loading") return <div className="container py-8">Loading...</div>;

  async function fetchAddresses() {
    const res = await fetch("/api/account/addresses");
    setAddresses(await res.json());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editId ? `/api/account/addresses/${editId}` : "/api/account/addresses";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        toast({ title: editId ? "Address updated" : "Address added" });
        setOpen(false);
        setForm(emptyAddress);
        setEditId(null);
        fetchAddresses();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return;
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    fetchAddresses();
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/account/addresses/${id}/default`, { method: "PUT" });
    fetchAddresses();
  }

  function openEdit(addr: Address) {
    setForm({ name: addr.name, street: addr.street, city: addr.city, state: addr.state, zip: addr.zip, country: addr.country, phone: addr.phone });
    setEditId(addr.id);
    setOpen(true);
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Addresses</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(emptyAddress); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button>Add Address</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Address" : "New Address"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label>Street Address</Label>
                <Input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>State/Region</Label>
                  <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>ZIP Code</Label>
                  <Input value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Address"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No addresses yet.</p>
      ) : (
        <div className="space-y-4">
          {addresses.map(addr => (
            <Card key={addr.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{addr.name} {addr.isDefault && <Badge variant="secondary">Default</Badge>}</p>
                    <p className="text-sm text-muted-foreground">{addr.street}</p>
                    <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.zip}</p>
                    <p className="text-sm text-muted-foreground">{addr.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    {!addr.isDefault && (
                      <Button variant="ghost" size="sm" onClick={() => handleSetDefault(addr.id)}>Set Default</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(addr)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(addr.id)}>Delete</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
