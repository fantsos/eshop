import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const category = await prisma.category.update({ where: { id: params.id }, data: { nameEn: body.nameEn, nameEl: body.nameEl, slug: body.slug || slugify(body.nameEn) } });
  return NextResponse.json(category);
}
