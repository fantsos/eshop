import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const product = await prisma.product.create({
      data: { nameEl: body.nameEl, nameEn: body.nameEn, sku: body.sku, slug: slugify(body.nameEn), descriptionEl: body.descriptionEl || null, descriptionEn: body.descriptionEn || null, price: body.price, compareAtPrice: body.compareAtPrice || null, categoryId: body.categoryId || null, brand: body.brand || null, stock: body.stock || 0, weight: body.weight || null, images: body.images || [], isActive: body.isActive ?? true, isFeatured: body.isFeatured ?? false },
    });
    return NextResponse.json(product);
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
