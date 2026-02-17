import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber");
  const email = searchParams.get("email");

  if (!orderNumber || !email) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      OR: [
        { user: { email: email.toLowerCase() } },
        { guestEmail: email.toLowerCase() },
      ],
    },
    include: {
      items: { include: { product: { select: { nameEn: true, nameEl: true } } } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    total: order.total,
    items: order.items.map((item) => ({
      name: item.product?.nameEn || item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  });
}
