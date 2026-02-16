import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Monthly revenue for the last 12 months (only PAID orders)
  const monthlyRevenue = await prisma.$queryRaw<
    { month: Date; revenue: number }[]
  >`
    SELECT
      DATE_TRUNC('month', "createdAt") AS month,
      COALESCE(SUM("total"), 0) AS revenue
    FROM "Order"
    WHERE "paymentStatus" = 'PAID'
      AND "createdAt" >= ${twelveMonthsAgo}
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month ASC
  `;

  // Build a full 12-month array (filling in zero for months with no revenue)
  const monthlyData: { month: string; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const found = monthlyRevenue.find((r) => {
      const rd = new Date(r.month);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    });
    monthlyData.push({
      month: label,
      revenue: found ? Number(found.revenue) : 0,
    });
  }

  // Order count by status
  const ordersByStatus = await prisma.order.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const statusData = ordersByStatus.map((s) => ({
    status: s.status,
    count: s._count.id,
  }));

  return NextResponse.json({ monthlyData, statusData });
}
