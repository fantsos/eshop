"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, ChevronRight, GripVertical, Trash2 } from "lucide-react";

const emptyForm = { nameEn: "", nameEl: "", slug: "", parentId: "", metaTitleEn: "", metaTitleEl: "", metaDescriptionEn: "", metaDescriptionEl: "", metaKeywords: "", seoH1En: "", seoH1El: "", seoH2En: "", seoH2El: "" };

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [showSeo, setShowSeo] = useState(false);

  const loadCategories = () => {
    fetch("/api/admin/categories").then(r => r.json()).then(setCategories);
  };

  useEffect(() => { loadCategories(); }, []);

  const handleSave = async () => {
    const url = editCat ? `/api/admin/categories/${editCat.id}` : "/api/admin/categories";
    const res = await fetch(url, { method: editCat ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast({ title: "Category saved" }); setOpen(false); setEditCat(null); setForm(emptyForm); setShowSeo(false); loadCategories(); }
    else { const data = await res.json(); toast({ title: "Error", description: data.error, variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "Category deleted" }); loadCategories(); }
    else toast({ title: "Error", variant: "destructive" });
  };

  const parentCategories = categories.filter((c: any) => !c.parentId).sort((a: any, b: any) => a.order - b.order);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    if (sourceIndex === destIndex) return;

    const reordered = [...parentCategories];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, moved);

    // Optimistic update
    const newOrder = reordered.map((cat, i) => ({ ...cat, order: i }));
    setCategories(prev => {
      const children = prev.filter(c => c.parentId);
      return [...newOrder, ...children];
    });

    // Save to API
    try {
      await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map(c => c.id) }),
      });
    } catch {
      loadCategories(); // Revert on error
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Button onClick={() => { setEditCat(null); setForm(emptyForm); setShowSeo(false); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Drag to reorder categories</p>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="categories">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
              {parentCategories.map((cat: any, index: number) => (
                <Draggable key={cat.id} draggableId={cat.id} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} className={snapshot.isDragging ? "opacity-80" : ""}>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <span className="font-medium">{cat.nameEn}</span>
                              <span className="text-sm text-muted-foreground">({cat.nameEl})</span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => { setEditCat(cat); setForm({ nameEn: cat.nameEn, nameEl: cat.nameEl, slug: cat.slug, parentId: "", metaTitleEn: cat.metaTitleEn || "", metaTitleEl: cat.metaTitleEl || "", metaDescriptionEn: cat.metaDescriptionEn || "", metaDescriptionEl: cat.metaDescriptionEl || "", metaKeywords: cat.metaKeywords || "", seoH1En: cat.seoH1En || "", seoH1El: cat.seoH1El || "", seoH2En: cat.seoH2En || "", seoH2El: cat.seoH2El || "" }); setShowSeo(false); setOpen(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => { setEditCat(null); setForm({ ...emptyForm, parentId: cat.id }); setShowSeo(false); setOpen(true); }}>
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {categories.filter((c: any) => c.parentId === cat.id).sort((a: any, b: any) => a.order - b.order).map((sub: any) => (
                            <div key={sub.id} className="ml-10 mt-2 flex items-center justify-between py-1 border-l-2 pl-4">
                              <div className="flex items-center gap-3">
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{sub.nameEn}</span>
                                <span className="text-xs text-muted-foreground">({sub.nameEl})</span>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => { setEditCat(sub); setForm({ nameEn: sub.nameEn, nameEl: sub.nameEl, slug: sub.slug, parentId: sub.parentId || "", metaTitleEn: sub.metaTitleEn || "", metaTitleEl: sub.metaTitleEl || "", metaDescriptionEn: sub.metaDescriptionEn || "", metaDescriptionEl: sub.metaDescriptionEl || "", metaKeywords: sub.metaKeywords || "", seoH1En: sub.seoH1En || "", seoH1El: sub.seoH1El || "", seoH2En: sub.seoH2En || "", seoH2El: sub.seoH2El || "" }); setShowSeo(false); setOpen(true); }}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(sub.id)} className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCat ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name (English)</Label><Input value={form.nameEn} onChange={e => setForm({...form, nameEn: e.target.value})} /></div>
            <div className="space-y-2"><Label>Name (Greek)</Label><Input value={form.nameEl} onChange={e => setForm({...form, nameEl: e.target.value})} /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="auto-generated if empty" /></div>
            {!editCat && !form.parentId && (
              <div className="space-y-2">
                <Label>Parent Category (optional)</Label>
                <select className="w-full border rounded-md p-2" value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})}>
                  <option value="">None (top-level)</option>
                  {parentCategories.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
                </select>
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => setShowSeo(!showSeo)} className="w-full">{showSeo ? "Hide SEO Fields" : "Show SEO Fields"}</Button>
            {showSeo && (
              <div className="space-y-3 border-t pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Meta Title (EN)</Label><Input value={form.metaTitleEn} onChange={e => setForm({...form, metaTitleEn: e.target.value})} placeholder={form.nameEn} maxLength={70} /><p className="text-xs text-muted-foreground">{form.metaTitleEn.length}/70</p></div>
                  <div className="space-y-1"><Label className="text-xs">Meta Title (EL)</Label><Input value={form.metaTitleEl} onChange={e => setForm({...form, metaTitleEl: e.target.value})} placeholder={form.nameEl} maxLength={70} /><p className="text-xs text-muted-foreground">{form.metaTitleEl.length}/70</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Meta Description (EN)</Label><Textarea value={form.metaDescriptionEn} onChange={e => setForm({...form, metaDescriptionEn: e.target.value})} rows={2} maxLength={160} /><p className="text-xs text-muted-foreground">{form.metaDescriptionEn.length}/160</p></div>
                  <div className="space-y-1"><Label className="text-xs">Meta Description (EL)</Label><Textarea value={form.metaDescriptionEl} onChange={e => setForm({...form, metaDescriptionEl: e.target.value})} rows={2} maxLength={160} /><p className="text-xs text-muted-foreground">{form.metaDescriptionEl.length}/160</p></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Meta Keywords</Label><Input value={form.metaKeywords} onChange={e => setForm({...form, metaKeywords: e.target.value})} placeholder="keyword1, keyword2" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">SEO H1 (EN)</Label><Input value={form.seoH1En} onChange={e => setForm({...form, seoH1En: e.target.value})} placeholder={form.nameEn} /></div>
                  <div className="space-y-1"><Label className="text-xs">SEO H1 (EL)</Label><Input value={form.seoH1El} onChange={e => setForm({...form, seoH1El: e.target.value})} placeholder={form.nameEl} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">SEO H2 (EN)</Label><Input value={form.seoH2En} onChange={e => setForm({...form, seoH2En: e.target.value})} /></div>
                  <div className="space-y-1"><Label className="text-xs">SEO H2 (EL)</Label><Input value={form.seoH2El} onChange={e => setForm({...form, seoH2El: e.target.value})} /></div>
                </div>
              </div>
            )}
            <Button onClick={handleSave} className="w-full">{editCat ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
