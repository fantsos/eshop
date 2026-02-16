import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const category = await prisma.category.create({ data: { nameEn: body.nameEn, nameEl: body.nameEl, slug: body.slug || slugify(body.nameEn), parentId: body.parentId || null } });
    return NextResponse.json(category);
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
