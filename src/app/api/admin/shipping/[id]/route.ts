import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const zone = await prisma.shippingZone.update({
    where: { id: params.id },
    data: { name: body.name, regions: body.regions, rate: body.rate, freeAbove: body.freeAbove || null },
  });
  return NextResponse.json(zone);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.shippingZone.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
