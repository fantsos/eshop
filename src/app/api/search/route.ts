import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) return NextResponse.json([]);

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      OR: [
        { nameEn: { contains: q, mode: "insensitive" } },
        { nameEl: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, slug: true, nameEn: true, nameEl: true, price: true, images: true },
    take: 8,
  });

  return NextResponse.json(
    products.map((p) => ({ ...p, price: Number(p.price), image: p.images[0] || null }))
  );
}
