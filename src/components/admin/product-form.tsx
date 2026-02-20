"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";

interface ProductFormProps {
  categories: { id: string; name: string }[];
  product?: { id: string; nameEl: string; nameEn: string; sku: string; descriptionEl: string; descriptionEn: string; price: number; compareAtPrice?: number; categoryId: string; brand: string; stock: number; weight?: number; images: string[]; isActive: boolean; isFeatured: boolean; metaTitleEl?: string; metaTitleEn?: string; metaDescriptionEl?: string; metaDescriptionEn?: string; metaKeywords?: string; seoH1El?: string; seoH1En?: string; seoH2El?: string; seoH2En?: string; imageAlt?: string; canonicalUrl?: string };
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nameEl: product?.nameEl || "", nameEn: product?.nameEn || "", sku: product?.sku || "", descriptionEl: product?.descriptionEl || "", descriptionEn: product?.descriptionEn || "", price: product?.price || 0, compareAtPrice: product?.compareAtPrice || 0, categoryId: product?.categoryId || "", brand: product?.brand || "", stock: product?.stock || 0, weight: product?.weight || 0, isActive: product?.isActive ?? true, isFeatured: product?.isFeatured ?? false, metaTitleEl: product?.metaTitleEl || "", metaTitleEn: product?.metaTitleEn || "", metaDescriptionEl: product?.metaDescriptionEl || "", metaDescriptionEn: product?.metaDescriptionEn || "", metaKeywords: product?.metaKeywords || "", seoH1El: product?.seoH1El || "", seoH1En: product?.seoH1En || "", seoH2El: product?.seoH2El || "", seoH2En: product?.seoH2En || "", imageAlt: product?.imageAlt || "", canonicalUrl: product?.canonicalUrl || "" });
  const [images, setImages] = useState<string[]>(product?.images || []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) { const data = await res.json(); setImages(prev => [...prev, data.url]); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
      const res = await fetch(url, { method: product ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, images }) });
      if (res.ok) { toast({ title: "Success" }); router.push("/admin/products"); router.refresh(); }
      else { const data = await res.json(); toast({ title: "Error", description: data.error, variant: "destructive" }); }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <Card><CardHeader><CardTitle>Basic Info</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Name (English)</Label><Input value={form.nameEn} onChange={e => setForm({...form, nameEn: e.target.value})} required /></div>
          <div className="space-y-2"><Label>Name (Greek)</Label><Input value={form.nameEl} onChange={e => setForm({...form, nameEl: e.target.value})} required /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} required /></div>
          <div className="space-y-2"><Label>Brand</Label><Input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div>
        </div>
        <div className="space-y-2"><Label>Description (English)</Label><Textarea value={form.descriptionEn} onChange={e => setForm({...form, descriptionEn: e.target.value})} rows={4} /></div>
        <div className="space-y-2"><Label>Description (Greek)</Label><Textarea value={form.descriptionEl} onChange={e => setForm({...form, descriptionEl: e.target.value})} rows={4} /></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>Price (€)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} required /></div>
          <div className="space-y-2"><Label>Compare Price (€)</Label><Input type="number" step="0.01" value={form.compareAtPrice} onChange={e => setForm({...form, compareAtPrice: parseFloat(e.target.value) || 0})} /></div>
          <div className="space-y-2"><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value) || 0})} required /></div>
          <div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" step="0.001" value={form.weight} onChange={e => setForm({...form, weight: parseFloat(e.target.value) || 0})} /></div>
        </div>
        <div className="space-y-2"><Label>Category</Label>
          <Select value={form.categoryId} onValueChange={v => setForm({...form, categoryId: v})}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2"><Checkbox checked={form.isActive} onCheckedChange={v => setForm({...form, isActive: !!v})} /><Label>Active</Label></div>
          <div className="flex items-center gap-2"><Checkbox checked={form.isFeatured} onCheckedChange={v => setForm({...form, isFeatured: !!v})} /><Label>Featured</Label></div>
        </div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Images</CardTitle></CardHeader><CardContent>
        <div className="grid grid-cols-4 gap-4 mb-4">
          {images.map((img, i) => (<div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted"><Image src={img} alt="" fill className="object-cover" /><button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X className="h-3 w-3" /></button></div>))}
          <label className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary"><Upload className="h-8 w-8 text-muted-foreground" /><input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} /></label>
        </div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>SEO</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Meta Title (English)</Label><Input value={form.metaTitleEn} onChange={e => setForm({...form, metaTitleEn: e.target.value})} placeholder={form.nameEn} maxLength={70} /><p className="text-xs text-muted-foreground">{form.metaTitleEn.length || 0}/70</p></div>
          <div className="space-y-2"><Label>Meta Title (Greek)</Label><Input value={form.metaTitleEl} onChange={e => setForm({...form, metaTitleEl: e.target.value})} placeholder={form.nameEl} maxLength={70} /><p className="text-xs text-muted-foreground">{form.metaTitleEl.length || 0}/70</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Meta Description (English)</Label><Textarea value={form.metaDescriptionEn} onChange={e => setForm({...form, metaDescriptionEn: e.target.value})} placeholder={form.descriptionEn?.slice(0, 160)} rows={3} maxLength={160} /><p className="text-xs text-muted-foreground">{form.metaDescriptionEn.length || 0}/160</p></div>
          <div className="space-y-2"><Label>Meta Description (Greek)</Label><Textarea value={form.metaDescriptionEl} onChange={e => setForm({...form, metaDescriptionEl: e.target.value})} placeholder={form.descriptionEl?.slice(0, 160)} rows={3} maxLength={160} /><p className="text-xs text-muted-foreground">{form.metaDescriptionEl.length || 0}/160</p></div>
        </div>
        <div className="space-y-2"><Label>Meta Keywords</Label><Input value={form.metaKeywords} onChange={e => setForm({...form, metaKeywords: e.target.value})} placeholder="keyword1, keyword2, keyword3" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>SEO H1 (English)</Label><Input value={form.seoH1En} onChange={e => setForm({...form, seoH1En: e.target.value})} placeholder={form.nameEn} /></div>
          <div className="space-y-2"><Label>SEO H1 (Greek)</Label><Input value={form.seoH1El} onChange={e => setForm({...form, seoH1El: e.target.value})} placeholder={form.nameEl} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>SEO H2 (English)</Label><Input value={form.seoH2En} onChange={e => setForm({...form, seoH2En: e.target.value})} /></div>
          <div className="space-y-2"><Label>SEO H2 (Greek)</Label><Input value={form.seoH2El} onChange={e => setForm({...form, seoH2El: e.target.value})} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Image Alt Text</Label><Input value={form.imageAlt} onChange={e => setForm({...form, imageAlt: e.target.value})} placeholder={form.nameEn} /></div>
          <div className="space-y-2"><Label>Canonical URL</Label><Input value={form.canonicalUrl} onChange={e => setForm({...form, canonicalUrl: e.target.value})} placeholder="Leave empty for auto-generated" /></div>
        </div>
        <div className="border rounded-lg p-4 bg-muted/50">
          <p className="text-xs text-muted-foreground mb-2">Google Preview</p>
          <div className="space-y-1">
            <p className="text-blue-600 text-lg truncate">{form.metaTitleEn || form.nameEn || "Page Title"}</p>
            <p className="text-green-700 text-sm truncate">{form.canonicalUrl || `fantsos.gr/product/...`}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{form.metaDescriptionEn || form.descriptionEn?.slice(0, 160) || "Product description will appear here..."}</p>
          </div>
        </div>
      </CardContent></Card>

      <Button type="submit" disabled={loading} size="lg">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{product ? "Update Product" : "Create Product"}</Button>
    </form>
  );
}
