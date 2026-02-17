import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { XMLParser } from "fast-xml-parser";

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function extractKeys(obj: any): string[] {
  if (!obj || typeof obj !== "object") return [];
  return Object.keys(obj).filter((k) => typeof obj[k] !== "object" || obj[k] === null);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { url, productPath } = await req.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
    });
    const parsed = parser.parse(xml);

    // If productPath is provided, try to get sample product
    if (productPath) {
      const products = getNestedValue(parsed, productPath);
      const sample = Array.isArray(products) ? products[0] : products;
      const tags = extractKeys(sample);
      return NextResponse.json({ tags, sample, totalProducts: Array.isArray(products) ? products.length : 1 });
    }

    // Otherwise return top-level structure to help find productPath
    return NextResponse.json({ structure: Object.keys(parsed), raw: parsed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
