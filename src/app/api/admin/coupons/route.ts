import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const coupon = await prisma.coupon.create({ data: { code: body.code, type: body.type, value: body.value, minOrder: body.minOrder || null, maxUses: body.maxUses || null, expiresAt: body.expiresAt ? new Date(body.expiresAt) : null, isActive: true } });
    return NextResponse.json(coupon);
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
