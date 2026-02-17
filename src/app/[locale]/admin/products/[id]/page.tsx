import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params: { id } }: { params: { locale: string; id: string } }) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { nameEn: "asc" } });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Product</h1>
      <ProductForm categories={categories.map(c => ({ id: c.id, name: c.nameEn }))} product={{ id: product.id, nameEl: product.nameEl, nameEn: product.nameEn, sku: product.sku, descriptionEl: product.descriptionEl || "", descriptionEn: product.descriptionEn || "", price: Number(product.price), compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined, categoryId: product.categoryId || "", brand: product.brand || "", stock: product.stock, weight: product.weight ? Number(product.weight) : undefined, images: product.images, isActive: product.isActive, isFeatured: product.isFeatured, metaTitleEl: product.metaTitleEl || "", metaTitleEn: product.metaTitleEn || "", metaDescriptionEl: product.metaDescriptionEl || "", metaDescriptionEn: product.metaDescriptionEn || "", metaKeywords: product.metaKeywords || "", seoH1El: product.seoH1El || "", seoH1En: product.seoH1En || "", seoH2El: product.seoH2El || "", seoH2En: product.seoH2En || "", imageAlt: product.imageAlt || "", canonicalUrl: product.canonicalUrl || "" }} />
    </div>
  );
}
