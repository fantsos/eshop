import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const addresses = await prisma.address.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { isDefault: "desc" },
  });
  return NextResponse.json(addresses);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const userId = (session.user as any).id;

  // If first address, make it default
  const count = await prisma.address.count({ where: { userId } });
  const address = await prisma.address.create({
    data: { ...body, userId, isDefault: count === 0 },
  });
  return NextResponse.json(address);
}
