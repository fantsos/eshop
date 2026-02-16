import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/product-card";

function serializeProduct(p: any) {
  return {
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    flashSalePrice: p.flashSalePrice ? Number(p.flashSalePrice) : null,
    weight: p.weight ? Number(p.weight) : null,
    rating: p.rating ? Number(p.rating) : null,
  };
}

export default async function DealsPage() {
  const now = new Date();

  // Get flash sale products
  const flashProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      flashSalePrice: { not: null },
      flashSaleStart: { lte: now },
      flashSaleEnd: { gte: now },
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  // Get products with compareAtPrice (on sale)
  const saleProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      compareAtPrice: { not: null },
      id: { notIn: flashProducts.map(p => p.id) },
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="container py-8">
      {flashProducts.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-red-600">Flash Sale</h2>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">Limited Time</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {flashProducts.map(p => (
              <ProductCard key={p.id} product={serializeProduct(p)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold mb-6">On Sale</h2>
        {saleProducts.length === 0 && flashProducts.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No deals available right now. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {saleProducts.map(p => (
              <ProductCard key={p.id} product={serializeProduct(p)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
