import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { sendMail, orderConfirmationEmail } from "@/lib/mail";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { items, shippingAddress, paymentMethod, subtotal, shipping, codFee = 0, tax = 0, discount = 0, total, couponCode } = body;

    if (!items?.length || !shippingAddress || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create address
    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        name: shippingAddress.name,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state || "",
        zip: shippingAddress.zip,
        country: shippingAddress.country || "GR",
        phone: shippingAddress.phone || "",
      },
    });

    const orderNumber = generateOrderNumber();

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        orderNumber,
        status: "PENDING",
        subtotal,
        shipping,
        tax,
        discount,
        total: total,
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
        shippingAddressId: address.id,
        billingAddressId: address.id,
        couponCode: couponCode || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
          })),
        },
      },
    });

    // Update coupon usage
    if (couponCode) {
      try {
        await prisma.coupon.update({
          where: { code: couponCode },
          data: { usedCount: { increment: 1 } },
        });
      } catch {}
    }

    // Update stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          salesCount: { increment: item.quantity },
        },
      });
    }

    // Send confirmation email
    try {
      const emailContent = orderConfirmationEmail(orderNumber, `€${total.toFixed(2)}`, "el");
      if (session.user.email) {
        await sendMail({ to: session.user.email, ...emailContent });
      }
    } catch (e) {
      console.error("Email send failed:", e);
    }

    return NextResponse.json({ orderNumber, orderId: order.id });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
