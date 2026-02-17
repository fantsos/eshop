import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

// Call this via cron job: GET /api/cron/abandoned-cart?key=YOUR_CRON_SECRET
// Sends reminders for carts abandoned for more than 24 hours
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  const maxAge = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Don't email carts older than 7 days

  const abandonedCarts = await prisma.cart.findMany({
    where: {
      userId: { not: null },
      updatedAt: { lt: cutoff, gt: maxAge },
      items: { some: {} },
    },
    include: {
      user: { select: { email: true, name: true } },
      items: { include: { product: { select: { nameEn: true, nameEl: true, price: true, images: true } } }, take: 5 },
    },
  });

  let sent = 0;
  for (const cart of abandonedCarts) {
    if (!cart.user?.email) continue;

    // Check if user already has a recent order (they may have checked out via different method)
    const recentOrder = await prisma.order.findFirst({
      where: { userId: cart.userId!, createdAt: { gt: cutoff } },
    });
    if (recentOrder) continue;

    const itemsList = cart.items.map(item =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${item.product.nameEn}</td><td style="padding:8px;border-bottom:1px solid #eee;">&euro;${Number(item.product.price).toFixed(2)}</td><td style="padding:8px;border-bottom:1px solid #eee;">${item.quantity}</td></tr>`
    ).join("");

    await sendMail({
      to: cart.user.email,
      subject: "You left items in your cart!",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Don't forget your items!</h2>
          <p>Hi ${cart.user.name || "there"},</p>
          <p>You have items waiting in your shopping cart:</p>
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#f3f4f6;"><th style="padding:8px;text-align:left;">Product</th><th style="padding:8px;text-align:left;">Price</th><th style="padding:8px;text-align:left;">Qty</th></tr></thead>
            <tbody>${itemsList}</tbody>
          </table>
          <p style="margin-top:20px;"><a href="${process.env.NEXTAUTH_URL}/cart" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Complete Your Purchase</a></p>
          <p style="color:#999;font-size:12px;margin-top:20px;">If you've already completed your purchase, please ignore this email.</p>
        </div>
      `,
    });
    sent++;
  }

  return NextResponse.json({ sent, total: abandonedCarts.length });
}
