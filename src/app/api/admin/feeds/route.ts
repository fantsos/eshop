import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const feeds = await prisma.supplierFeed.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(feeds);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const feed = await prisma.supplierFeed.create({
      data: {
        name: body.name,
        url: body.url,
        syncInterval: body.syncInterval || 6,
        fieldMapping: body.fieldMapping || {},
        productPath: body.productPath || "",
        defaultCategoryId: body.defaultCategoryId || null,
        markupPercent: body.markupPercent || null,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(feed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
