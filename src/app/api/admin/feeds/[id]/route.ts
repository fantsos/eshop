import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const feed = await prisma.supplierFeed.findUnique({
    where: { id: params.id },
    include: { _count: { select: { products: true } } },
  });
  if (!feed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(feed);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const feed = await prisma.supplierFeed.update({
      where: { id: params.id },
      data: {
        name: body.name,
        url: body.url,
        syncInterval: body.syncInterval,
        fieldMapping: body.fieldMapping,
        productPath: body.productPath,
        defaultCategoryId: body.defaultCategoryId || null,
        markupPercent: body.markupPercent || null,
        isActive: body.isActive,
      },
    });
    return NextResponse.json(feed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Remove feed association from products first
  await prisma.product.updateMany({
    where: { supplierFeedId: params.id },
    data: { supplierFeedId: null, supplierSku: null },
  });
  await prisma.supplierFeed.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
