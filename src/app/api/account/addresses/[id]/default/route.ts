import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  // Unset all defaults, then set the selected one
  await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  await prisma.address.updateMany({ where: { id: params.id, userId }, data: { isDefault: true } });

  return NextResponse.json({ success: true });
}
