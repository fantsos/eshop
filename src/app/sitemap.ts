import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXTAUTH_URL || "https://fantsos.gr";

function withHreflang(path: string, extra?: Partial<MetadataRoute.Sitemap[0]>) {
  return {
    url: `${BASE_URL}${path}`,
    alternates: {
      languages: {
        el: `${BASE_URL}/el${path}`,
        en: `${BASE_URL}/en${path}`,
      },
    },
    ...extra,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string }[] = [];

  try {
    products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
  } catch {
    // DB not available during build
  }

  const staticPages = [
    withHreflang("", { lastModified: new Date(), changeFrequency: "daily", priority: 1 }),
    withHreflang("/products", { lastModified: new Date(), changeFrequency: "daily", priority: 0.9 }),
    withHreflang("/categories", { lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 }),
    withHreflang("/deals", { lastModified: new Date(), changeFrequency: "daily", priority: 0.8 }),
    withHreflang("/about", { changeFrequency: "monthly", priority: 0.4 }),
    withHreflang("/contact", { changeFrequency: "monthly", priority: 0.4 }),
    withHreflang("/faq", { changeFrequency: "monthly", priority: 0.4 }),
    withHreflang("/privacy", { changeFrequency: "yearly", priority: 0.2 }),
    withHreflang("/terms", { changeFrequency: "yearly", priority: 0.2 }),
    withHreflang("/shipping-policy", { changeFrequency: "yearly", priority: 0.3 }),
    withHreflang("/return-policy", { changeFrequency: "yearly", priority: 0.3 }),
  ];

  const productPages = products.map((p) =>
    withHreflang(`/product/${p.slug}`, { lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.7 })
  );

  const categoryPages = categories.map((c) =>
    withHreflang(`/category/${c.slug}`, { changeFrequency: "weekly", priority: 0.6 })
  );

  return [...staticPages, ...productPages, ...categoryPages];
}
