"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface Review { id: string; rating: number; title: string | null; comment: string | null; images: string[]; userName: string; userAvatar: string | null; isVerified: boolean; createdAt: string; }

export function ProductReviews({ productId, reviews }: { productId: string; reviews: Review[] }) {
  const t = useTranslations("common");
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, rating, title, comment }) });
      if (res.ok) { toast({ title: t("success") }); setShowForm(false); window.location.reload(); }
      else { const data = await res.json(); toast({ title: t("error"), description: data.error, variant: "destructive" }); }
    } catch { toast({ title: t("error"), variant: "destructive" }); }
    setSubmitting(false);
  };

  return (
    <div>
      {session && !showForm && <Button onClick={() => setShowForm(true)} className="mb-6">Write a Review</Button>}
      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 mb-6 space-y-4">
          <div>
            <p className="font-medium mb-1">{t("rating")}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <Star className={`h-6 w-6 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                </button>
              ))}
            </div>
          </div>
          <Input placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Your review..." value={comment} onChange={e => setComment(e.target.value)} />
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>{t("submit")}</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
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
                  {review.isVerified && <Badge variant="success" className="text-xs">Verified</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />))}
                  <span className="text-xs text-muted-foreground ml-2">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            {review.title && <p className="font-medium">{review.title}</p>}
            {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
