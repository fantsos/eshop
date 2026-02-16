import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const address = await prisma.address.updateMany({
    where: { id: params.id, userId: (session.user as any).id },
    data: { name: body.name, street: body.street, city: body.city, state: body.state, zip: body.zip, country: body.country, phone: body.phone },
  });
  return NextResponse.json(address);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.address.deleteMany({
    where: { id: params.id, userId: (session.user as any).id },
  });
  return NextResponse.json({ success: true });
}
