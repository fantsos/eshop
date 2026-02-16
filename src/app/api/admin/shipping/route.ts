import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const zones = await prisma.shippingZone.findMany();
  return NextResponse.json(zones.map(z => ({ ...z, rate: Number(z.rate), freeAbove: z.freeAbove ? Number(z.freeAbove) : null })));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const zone = await prisma.shippingZone.create({
    data: { name: body.name, regions: body.regions || [], rate: body.rate, freeAbove: body.freeAbove || null },
  });
  return NextResponse.json(zone);
}
