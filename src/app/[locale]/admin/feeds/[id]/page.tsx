"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, RefreshCw, Search, Save } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PRODUCT_FIELDS = [
  { key: "sku", label: "SKU (required)" },
  { key: "nameEl", label: "Name (EL)" },
  { key: "nameEn", label: "Name (EN)" },
  { key: "price", label: "Price" },
  { key: "stock", label: "Stock" },
  { key: "descriptionEl", label: "Description (EL)" },
  { key: "descriptionEn", label: "Description (EN)" },
  { key: "brand", label: "Brand" },
  { key: "category", label: "Category" },
  { key: "image", label: "Image URL" },
  { key: "weight", label: "Weight" },
];

interface Category {
  id: string;
  nameEn: string;
}

export default function EditFeedPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const prefix = pathname.startsWith("/en") ? "/en" : "";
  const feedId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [xmlTags, setXmlTags] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<any>(null);
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    name: "",
    url: "",
    syncInterval: 6,
    productPath: "",
    markupPercent: "",
    defaultCategoryId: "",
    isActive: true,
    fieldMapping: {} as Record<string, string>,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/feeds/${feedId}`).then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]).then(([feed, cats]) => {
      if (feed.error) {
        toast({ title: "Feed not found", variant: "destructive" });
        router.push(`${prefix}/admin/feeds`);
        return;
      }
      setForm({
        name: feed.name,
        url: feed.url,
        syncInterval: feed.syncInterval,
        productPath: feed.productPath,
        markupPercent: feed.markupPercent || "",
        defaultCategoryId: feed.defaultCategoryId || "",
        isActive: feed.isActive,
        fieldMapping: (feed.fieldMapping as Record<string, string>) || {},
      });
      setCategories(cats);
      setLoading(false);
    });
  }, [feedId]);

  const handleTestUrl = async () => {
    setTesting(true);
    try {
      const res = await fetch(`/api/admin/feeds/${feedId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url, productPath: form.productPath }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.tags) {
          setXmlTags(data.tags);
          setSampleData(data.sample);
          setTotalProducts(data.totalProducts);
          toast({ title: "XML parsed successfully", description: `Found ${data.totalProducts} products with ${data.tags.length} fields` });
        } else if (data.structure) {
          toast({ title: "Set product path", description: `Top-level keys: ${data.structure.join(", ")}` });
          setXmlTags([]);
          setSampleData(data.raw);
        }
      } else {
        toast({ title: "Test failed", description: data.error, variant: "destructive" });
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/feeds/${feedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          url: form.url,
          syncInterval: form.syncInterval,
          productPath: form.productPath,
          markupPercent: form.markupPercent ? parseFloat(form.markupPercent) : null,
          defaultCategoryId: form.defaultCategoryId || null,
          isActive: form.isActive,
          fieldMapping: form.fieldMapping,
        }),
      });
      if (res.ok) {
        toast({ title: "Feed saved" });
      } else {
        const data = await res.json();
        toast({ title: "Save failed", description: data.error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/admin/feeds/${feedId}/sync`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Sync completed", description: `Created: ${data.created}, Updated: ${data.updated}, Deactivated: ${data.deactivated}` });
      } else {
        toast({ title: "Sync failed", description: data.error, variant: "destructive" });
      }
    } finally {
      setSyncing(false);
    }
  };

  const updateMapping = (productField: string, xmlTag: string) => {
    setForm((prev) => ({
      ...prev,
      fieldMapping: { ...prev.fieldMapping, [productField]: xmlTag || undefined } as Record<string, string>,
    }));
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`${prefix}/admin/feeds`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Feed</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} /> Sync Now
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feed Settings */}
        <Card>
          <CardHeader><CardTitle>Feed Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>XML URL</Label>
              <div className="flex gap-2">
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="flex-1" />
                <Button variant="outline" onClick={handleTestUrl} disabled={testing}>
                  <Search className={`h-4 w-4 mr-1 ${testing ? "animate-spin" : ""}`} /> Test
                </Button>
              </div>
            </div>
            <div>
              <Label>Product Path (dot notation)</Label>
              <Input value={form.productPath} onChange={(e) => setForm({ ...form, productPath: e.target.value })} placeholder="e.g. store.products.product" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sync Interval (hours)</Label>
                <Input type="number" value={form.syncInterval} onChange={(e) => setForm({ ...form, syncInterval: parseInt(e.target.value) || 6 })} />
              </div>
              <div>
                <Label>Markup %</Label>
                <Input type="number" value={form.markupPercent} onChange={(e) => setForm({ ...form, markupPercent: e.target.value })} placeholder="e.g. 20" />
              </div>
            </div>
            <div>
              <Label>Default Category</Label>
              <Select value={form.defaultCategoryId} onValueChange={(v) => setForm({ ...form, defaultCategoryId: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nameEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </CardContent>
        </Card>

        {/* Field Mapping */}
        <Card>
          <CardHeader>
            <CardTitle>Field Mapping</CardTitle>
            {xmlTags.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {totalProducts} products found. Available XML tags shown in dropdowns.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {PRODUCT_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <Label className="w-40 text-sm shrink-0">{field.label}</Label>
                {xmlTags.length > 0 ? (
                  <Select value={form.fieldMapping[field.key] || ""} onValueChange={(v) => updateMapping(field.key, v)}>
                    <SelectTrigger><SelectValue placeholder="Select XML tag" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- None --</SelectItem>
                      {xmlTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag} {sampleData?.[tag] !== undefined ? `(${String(sampleData[tag]).slice(0, 40)})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={form.fieldMapping[field.key] || ""}
                    onChange={(e) => updateMapping(field.key, e.target.value)}
                    placeholder="XML tag name"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
