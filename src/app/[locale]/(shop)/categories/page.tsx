import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("meta.categoriesTitle"), description: t("meta.categoriesDescription") };
}

export default async function CategoriesPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations("common");
  const prefix = locale === "en" ? "/en" : "";
  const categories = await prisma.category.findMany({ where: { isActive: true, parentId: null }, include: { children: { where: { isActive: true }, orderBy: { order: "asc" } } }, orderBy: { order: "asc" } });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t("categories")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <Card key={cat.id} className="overflow-hidden">
            <Link href={`${prefix}/category/${cat.slug}`}>
              <div className="relative aspect-[16/9] bg-muted">
                {cat.image && <Image src={cat.image} alt={locale === "en" ? cat.nameEn : cat.nameEl} fill className="object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <h2 className="absolute bottom-4 left-4 text-white text-xl font-bold">{locale === "en" ? cat.nameEn : cat.nameEl}</h2>
              </div>
            </Link>
            {cat.children.length > 0 && (
              <CardContent className="p-4"><div className="flex flex-wrap gap-2">{cat.children.map(sub => (<Link key={sub.id} href={`${prefix}/category/${sub.slug}`} className="text-sm text-primary hover:underline">{locale === "en" ? sub.nameEn : sub.nameEl}</Link>))}</div></CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
