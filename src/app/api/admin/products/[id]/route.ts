import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const product = await prisma.product.update({ where: { id: params.id }, data: { nameEl: body.nameEl, nameEn: body.nameEn, sku: body.sku, slug: slugify(body.nameEn), descriptionEl: body.descriptionEl || null, descriptionEn: body.descriptionEn || null, price: body.price, compareAtPrice: body.compareAtPrice || null, categoryId: body.categoryId || null, brand: body.brand || null, stock: body.stock || 0, weight: body.weight || null, images: body.images || [], isActive: body.isActive ?? true, isFeatured: body.isFeatured ?? false, metaTitleEl: body.metaTitleEl || null, metaTitleEn: body.metaTitleEn || null, metaDescriptionEl: body.metaDescriptionEl || null, metaDescriptionEn: body.metaDescriptionEn || null, metaKeywords: body.metaKeywords || null, seoH1El: body.seoH1El || null, seoH1En: body.seoH1En || null, seoH2El: body.seoH2El || null, seoH2En: body.seoH2En || null, imageAlt: body.imageAlt || null, canonicalUrl: body.canonicalUrl || null } });
    return NextResponse.json(product);
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
