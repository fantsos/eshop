"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

export function ImageGallery({ images, name, imageAlt, flashSaleLabel }: { images: string[]; name: string; imageAlt?: string; flashSaleLabel?: string }) {
  const t = useTranslations("common");
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center text-muted-foreground">
        {t("noImage")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
        <Image src={images[selected]} alt={imageAlt || name} title={imageAlt || name} fill className="object-cover" priority />
        {flashSaleLabel && <Badge className="absolute top-3 left-3 bg-orange-500 text-lg px-3 py-1">{flashSaleLabel}</Badge>}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setSelected(prev => prev > 0 ? prev - 1 : images.length - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
              aria-label={t("previousImage")}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSelected(prev => prev < images.length - 1 ? prev + 1 : 0)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
              aria-label={t("nextImage")}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`relative aspect-square rounded-md overflow-hidden bg-muted border-2 transition-colors ${selected === i ? "border-primary" : "border-transparent hover:border-muted-foreground/30"}`}
              aria-label={t("selectImage", { index: i + 1 })}
            >
              <Image src={img} alt={`${imageAlt || name} ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
