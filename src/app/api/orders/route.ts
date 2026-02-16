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
  const body = await req.json();
  const { items, shippingAddress, paymentMethod, subtotal, shipping, codFee = 0, tax = 0, discount = 0, total, couponCode, paymentId, guestEmail } = body;

  // Allow guest checkout or authenticated users
  const userId = session?.user?.id;
  const email = session?.user?.email || guestEmail;

  if (!items?.length || !shippingAddress || !paymentMethod) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!userId && !guestEmail) {
    return NextResponse.json({ error: "Email is required for guest checkout" }, { status: 400 });
  }

  try {
    // Create address (linked to user if logged in)
    const address = await prisma.address.create({
      data: {
        ...(userId ? { userId } : {}),
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

    // Determine payment status
    let paymentStatus: "PENDING" | "PAID" = "PENDING";
    if (paymentId && (paymentMethod === "STRIPE" || paymentMethod === "PAYPAL")) {
      paymentStatus = "PAID";
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        ...(userId ? { userId } : {}),
        orderNumber,
        status: paymentStatus === "PAID" ? "CONFIRMED" : "PENDING",
        subtotal,
        shipping,
        tax,
        discount,
        total,
        paymentMethod,
        paymentStatus,
        paymentId: paymentId || null,
        guestEmail: !userId ? guestEmail : null,
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
      if (email) {
        const emailContent = orderConfirmationEmail(orderNumber, `€${total.toFixed(2)}`, "el");
        await sendMail({ to: email, ...emailContent });
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
