import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

// Call this via cron job: GET /api/cron/low-stock?key=YOUR_CRON_SECRET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lowStockProducts = await prisma.product.findMany({
    where: { isActive: true, stock: { lte: 5 } },
    select: { nameEn: true, sku: true, stock: true },
    orderBy: { stock: "asc" },
  });

  if (lowStockProducts.length === 0) {
    return NextResponse.json({ message: "No low stock products" });
  }

  const rows = lowStockProducts.map(p => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${p.nameEn}</td><td style="padding:8px;border-bottom:1px solid #eee;">${p.sku}</td><td style="padding:8px;border-bottom:1px solid #eee;color:${p.stock === 0 ? 'red' : 'orange'};font-weight:bold;">${p.stock}</td></tr>`).join("");

  await sendMail({
    to: process.env.ADMIN_EMAIL || "fantsos@gmail.com",
    subject: `Low Stock Alert: ${lowStockProducts.length} products`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2>Low Stock Alert</h2>
        <p>${lowStockProducts.length} product(s) have 5 or fewer items in stock:</p>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#f3f4f6;"><th style="padding:8px;text-align:left;">Product</th><th style="padding:8px;text-align:left;">SKU</th><th style="padding:8px;text-align:left;">Stock</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:20px;"><a href="${process.env.NEXTAUTH_URL}/admin/products">View in Admin Panel</a></p>
      </div>
    `,
  });

  return NextResponse.json({ sent: true, count: lowStockProducts.length });
}
