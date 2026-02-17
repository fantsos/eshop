import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data: any = {};

  if (body.role && ["ADMIN", "CUSTOMER"].includes(body.role)) {
    data.role = body.role;
  }
  if (typeof body.isBanned === "boolean") {
    data.isBanned = body.isBanned;
  }

  const user = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json({ id: user.id, role: user.role, isBanned: user.isBanned });
}
