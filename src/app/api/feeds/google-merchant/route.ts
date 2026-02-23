import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXTAUTH_URL || "https://fantsos.gr";

function imageUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
}

function xml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(str: string): string {
  // Decode HTML entities first (handles double-encoded HTML)
  let decoded = str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
  // Strip HTML tags
  return decoded
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    include: { category: true },
  });

  const now = new Date();

  const items = products
    .map((p) => {
      const isFlashSale =
        p.flashSalePrice &&
        p.flashSaleStart &&
        p.flashSaleEnd &&
        p.flashSaleStart <= now &&
        p.flashSaleEnd >= now;

      const price = Number(p.price).toFixed(2);
      const salePrice = isFlashSale
        ? Number(p.flashSalePrice).toFixed(2)
        : null;

      const img = p.images[0] ? imageUrl(p.images[0]) : null;
      const link = `${BASE_URL}/el/product/${p.slug}`;
      const desc = xml(stripHtml(p.descriptionEl || p.nameEl).substring(0, 5000));
      const category = p.category?.nameEl || "";

      return `
    <item>
      <g:id>${xml(p.sku)}</g:id>
      <g:title>${xml(p.nameEl)}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${link}</g:link>
      ${img ? `<g:image_link>${xml(img)}</g:image_link>` : ""}
      <g:availability>in stock</g:availability>
      <g:price>${price} EUR</g:price>
      ${salePrice ? `<g:sale_price>${salePrice} EUR</g:sale_price>` : ""}
      ${p.compareAtPrice && !isFlashSale ? `<g:original_price>${Number(p.compareAtPrice).toFixed(2)} EUR</g:original_price>` : ""}
      ${p.brand ? `<g:brand>${xml(p.brand)}</g:brand>` : ""}
      <g:condition>new</g:condition>
      <g:mpn>${xml(p.sku)}</g:mpn>
      ${category ? `<g:product_type>${xml(category)}</g:product_type>` : ""}
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
    })
    .join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Fantsos.gr</title>
    <link>${BASE_URL}</link>
    <description>Ηλεκτρονικό κατάστημα Fantsos.gr</description>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
