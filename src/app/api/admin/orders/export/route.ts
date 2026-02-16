import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    include: { user: { select: { name: true, email: true } }, items: true },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["Order Number", "Date", "Customer", "Email", "Status", "Payment Method", "Payment Status", "Items", "Subtotal", "Shipping", "Tax", "Discount", "Total"];

  const rows = orders.map((o) => [
    o.orderNumber,
    new Date(o.createdAt).toISOString().split("T")[0],
    `"${(o.user?.name || "").replace(/"/g, '""')}"`,
    o.user?.email || o.guestEmail || "",
    o.status,
    o.paymentMethod,
    o.paymentStatus,
    o.items.length,
    Number(o.subtotal).toFixed(2),
    Number(o.shipping).toFixed(2),
    Number(o.tax).toFixed(2),
    Number(o.discount).toFixed(2),
    Number(o.total).toFixed(2),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=orders-${new Date().toISOString().split("T")[0]}.csv`,
    },
  });
}
