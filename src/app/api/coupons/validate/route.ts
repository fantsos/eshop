import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();

    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }

    if (coupon.minOrder && subtotal < Number(coupon.minOrder)) {
      return NextResponse.json({ error: `Minimum order amount: €${Number(coupon.minOrder).toFixed(2)}` }, { status: 400 });
    }

    let discount = 0;
    if (coupon.type === "PERCENTAGE") {
      discount = subtotal * (Number(coupon.value) / 100);
    } else {
      discount = Math.min(Number(coupon.value), subtotal);
    }

    return NextResponse.json({ discount: Math.round(discount * 100) / 100, type: coupon.type, value: Number(coupon.value) });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
