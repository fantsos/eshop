import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { nameEn: "asc" } });
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Add Product</h1>
      <ProductForm categories={categories.map(c => ({ id: c.id, name: c.nameEn }))} />
    </div>
  );
}
