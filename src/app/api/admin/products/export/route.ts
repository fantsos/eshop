import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["SKU", "Name (EN)", "Name (EL)", "Description (EN)", "Description (EL)", "Price", "Compare At Price", "Brand", "Stock", "Category", "Weight", "Is Active", "Is Featured", "Flash Sale Price", "Flash Sale Start", "Flash Sale End"];

  const rows = products.map((p) => [
    p.sku,
    `"${(p.nameEn || "").replace(/"/g, '""')}"`,
    `"${(p.nameEl || "").replace(/"/g, '""')}"`,
    `"${(p.descriptionEn || "").replace(/"/g, '""')}"`,
    `"${(p.descriptionEl || "").replace(/"/g, '""')}"`,
    Number(p.price).toFixed(2),
    p.compareAtPrice ? Number(p.compareAtPrice).toFixed(2) : "",
    p.brand || "",
    p.stock,
    p.category?.nameEn || "",
    p.weight ? Number(p.weight) : "",
    p.isActive ? "Yes" : "No",
    p.isFeatured ? "Yes" : "No",
    p.flashSalePrice ? Number(p.flashSalePrice).toFixed(2) : "",
    p.flashSaleStart ? p.flashSaleStart.toISOString() : "",
    p.flashSaleEnd ? p.flashSaleEnd.toISOString() : "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=products-${new Date().toISOString().split("T")[0]}.csv`,
    },
  });
}
