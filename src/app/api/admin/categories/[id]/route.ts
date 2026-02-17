import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const category = await prisma.category.update({ where: { id: params.id }, data: { nameEn: body.nameEn, nameEl: body.nameEl, slug: body.slug || slugify(body.nameEn), metaTitleEl: body.metaTitleEl || null, metaTitleEn: body.metaTitleEn || null, metaDescriptionEl: body.metaDescriptionEl || null, metaDescriptionEn: body.metaDescriptionEn || null, metaKeywords: body.metaKeywords || null, seoH1El: body.seoH1El || null, seoH1En: body.seoH1En || null, seoH2El: body.seoH2El || null, seoH2En: body.seoH2En || null } });
  return NextResponse.json(category);
}
