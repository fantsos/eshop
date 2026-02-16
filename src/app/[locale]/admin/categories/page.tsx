"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Plus, Edit, ChevronRight } from "lucide-react";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState({ nameEn: "", nameEl: "", slug: "", parentId: "" });

  useEffect(() => {
    fetch("/api/admin/categories").then(r => r.json()).then(setCategories);
  }, []);

  const handleSave = async () => {
    const url = editCat ? `/api/admin/categories/${editCat.id}` : "/api/admin/categories";
    const res = await fetch(url, { method: editCat ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast({ title: "Category saved" }); setOpen(false); setEditCat(null); setForm({ nameEn: "", nameEl: "", slug: "", parentId: "" }); router.refresh(); fetch("/api/admin/categories").then(r => r.json()).then(setCategories); }
    else { const data = await res.json(); toast({ title: "Error", description: data.error, variant: "destructive" }); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><h1 className="text-3xl font-bold">Categories</h1><Button onClick={() => { setEditCat(null); setForm({ nameEn: "", nameEl: "", slug: "", parentId: "" }); setOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Add Category</Button></div>
      <div className="space-y-3">
        {categories.filter((c: any) => !c.parentId).map((cat: any) => (
          <Card key={cat.id}><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><span className="font-medium">{cat.nameEn}</span><span className="text-sm text-muted-foreground">({cat.nameEl})</span></div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditCat(cat); setForm({ nameEn: cat.nameEn, nameEl: cat.nameEl, slug: cat.slug, parentId: "" }); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => { setEditCat(null); setForm({ nameEn: "", nameEl: "", slug: "", parentId: cat.id }); setOpen(true); }}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            {categories.filter((c: any) => c.parentId === cat.id).map((sub: any) => (
              <div key={sub.id} className="ml-8 mt-2 flex items-center justify-between py-1 border-l-2 pl-4">
                <div className="flex items-center gap-3"><ChevronRight className="h-3 w-3 text-muted-foreground" /><span className="text-sm">{sub.nameEn}</span><span className="text-xs text-muted-foreground">({sub.nameEl})</span></div>
                <Button variant="ghost" size="sm" onClick={() => { setEditCat(sub); setForm({ nameEn: sub.nameEn, nameEl: sub.nameEl, slug: sub.slug, parentId: "" }); setOpen(true); }}><Edit className="h-3 w-3" /></Button>
              </div>
            ))}
          </CardContent></Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editCat ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Name (English)</Label><Input value={form.nameEn} onChange={e => setForm({...form, nameEn: e.target.value})} /></div>
          <div className="space-y-2"><Label>Name (Greek)</Label><Input value={form.nameEl} onChange={e => setForm({...form, nameEl: e.target.value})} /></div>
          <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="auto-generated if empty" /></div>
          <Button onClick={handleSave} className="w-full">{editCat ? "Update" : "Create"}</Button>
        </div>
      </DialogContent></Dialog>
    </div>
  );
}
