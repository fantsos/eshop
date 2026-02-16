import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXTAUTH_URL || "https://eshop.fantsos.gr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string }[] = [];

  try {
    products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    categories = await prisma.category.findMany({
      select: { slug: true },
    });
  } catch {
    // DB not available during build
  }

  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${BASE_URL}/categories`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/deals`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${BASE_URL}/en`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${BASE_URL}/en/products`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
  ];

  const productPages = products.flatMap((p) => [
    { url: `${BASE_URL}/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${BASE_URL}/en/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 },
  ]);

  const categoryPages = categories.flatMap((c) => [
    { url: `${BASE_URL}/category/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${BASE_URL}/en/category/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.5 },
  ]);

  return [...staticPages, ...productPages, ...categoryPages];
}
