"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Star, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";

interface Review { id: string; rating: number; title: string | null; comment: string | null; images: string[]; userName: string; userAvatar: string | null; isVerified: boolean; createdAt: string; }

export function ProductReviews({ productId, reviews }: { productId: string; reviews: Review[] }) {
  const t = useTranslations("common");
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (images.length + files.length > 3) {
      toast({ title: t("error"), description: t("maxImages"), variant: "destructive" });
      return;
    }
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          setImages(prev => [...prev, data.url]);
        }
      } catch {}
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, rating, title, comment, images }) });
      if (res.ok) { toast({ title: t("success") }); setShowForm(false); window.location.reload(); }
      else { const data = await res.json(); toast({ title: t("error"), description: data.error, variant: "destructive" }); }
    } catch { toast({ title: t("error"), variant: "destructive" }); }
    setSubmitting(false);
  };

  return (
    <div>
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)} role="dialog" aria-modal="true" aria-label={t("closeImage")}>
          <div className="relative max-w-3xl max-h-[90vh]">
            <Image src={lightbox} alt={t("reviews")} width={800} height={600} className="object-contain max-h-[90vh] rounded" />
            <button onClick={() => setLightbox(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1" aria-label={t("closeImage")}><X className="h-5 w-5" /></button>
          </div>
        </div>
      )}
      {session && !showForm && <Button onClick={() => setShowForm(true)} className="mb-6">{t("writeReview")}</Button>}
      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 mb-6 space-y-4">
          <div>
            <p className="font-medium mb-1">{t("rating")}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)} aria-label={t("rateStars", { count: s })}>
                  <Star className={`h-6 w-6 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                </button>
              ))}
            </div>
          </div>
          <Input placeholder={t("titleOptional")} value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder={t("yourReview")} value={comment} onChange={e => setComment(e.target.value)} />
          <div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            <div className="flex items-center gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative h-16 w-16 rounded border overflow-hidden group">
                  <Image src={img} alt={t("reviews")} fill className="object-cover" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} className="absolute top-0 right-0 bg-black/50 text-white rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-16 w-16 rounded border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <ImagePlus className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{images.length}/3 {t("images")}</p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>{t("submit")}</Button>
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setImages([]); }}>{t("cancel")}</Button>
          </div>
        </form>
      )}
      <div className="space-y-4">
        {reviews.length === 0 ? <p className="text-muted-foreground">{t("noResults")}</p> : reviews.map(review => (
          <div key={review.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-8 w-8">
                {review.userAvatar && <AvatarImage src={review.userAvatar} />}
                <AvatarFallback>{review.userName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{review.userName}</span>
                  {review.isVerified && <Badge variant="success" className="text-xs">{t("verified")}</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />))}
                  <span className="text-xs text-muted-foreground ml-2">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            {review.title && <p className="font-medium">{review.title}</p>}
            {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mt-2">
                {review.images.map((img, i) => (
                  <button key={i} onClick={() => setLightbox(img)} className="relative h-16 w-16 rounded overflow-hidden border hover:opacity-80 transition-opacity">
                    <Image src={img} alt={t("reviews")} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
