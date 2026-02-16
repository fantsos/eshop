import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });

  // Parse CSV (simple parser - handles quoted fields)
  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (line[i] === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += line[i];
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseCsvLine(lines[0]);
  const skuIdx = headers.findIndex((h) => h.toLowerCase().includes("sku"));
  const nameEnIdx = headers.findIndex((h) => h.toLowerCase().includes("name") && h.toLowerCase().includes("en"));
  const nameElIdx = headers.findIndex((h) => h.toLowerCase().includes("name") && h.toLowerCase().includes("el"));
  const priceIdx = headers.findIndex((h) => h.toLowerCase() === "price");
  const stockIdx = headers.findIndex((h) => h.toLowerCase().includes("stock"));
  const brandIdx = headers.findIndex((h) => h.toLowerCase().includes("brand"));
  const categoryIdx = headers.findIndex((h) => h.toLowerCase().includes("category"));

  if (skuIdx === -1 || nameEnIdx === -1 || priceIdx === -1) {
    return NextResponse.json({ error: "CSV must have SKU, Name (EN), and Price columns" }, { status: 400 });
  }

  // Cache categories
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.nameEn.toLowerCase(), c.id]));

  let imported = 0;
  let errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const fields = parseCsvLine(lines[i]);
      const sku = fields[skuIdx];
      const nameEn = fields[nameEnIdx];
      const price = parseFloat(fields[priceIdx]);

      if (!sku || !nameEn || isNaN(price)) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      const data: any = {
        sku,
        nameEn,
        nameEl: nameElIdx >= 0 ? fields[nameElIdx] || nameEn : nameEn,
        slug: slugify(nameEn),
        price,
        stock: stockIdx >= 0 ? parseInt(fields[stockIdx]) || 0 : 0,
        brand: brandIdx >= 0 ? fields[brandIdx] || null : null,
      };

      if (categoryIdx >= 0 && fields[categoryIdx]) {
        const catId = categoryMap.get(fields[categoryIdx].toLowerCase());
        if (catId) data.categoryId = catId;
      }

      await prisma.product.upsert({
        where: { sku },
        update: { nameEn: data.nameEn, nameEl: data.nameEl, price: data.price, stock: data.stock, brand: data.brand },
        create: data,
      });
      imported++;
    } catch (err: any) {
      errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  return NextResponse.json({ imported, errors, total: lines.length - 1 });
}
