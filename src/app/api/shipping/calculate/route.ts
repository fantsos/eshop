import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { weight, zip, subtotal } = await req.json();

  // Check if there's a shipping zone matching the ZIP prefix
  const zones = await prisma.shippingZone.findMany();

  let rate = 4.99; // default shipping rate
  let freeAbove: number | null = null;

  for (const zone of zones) {
    const regions = zone.regions as string[];
    if (regions.some((r) => zip?.startsWith(r) || r === "*")) {
      rate = Number(zone.rate);
      freeAbove = zone.freeAbove ? Number(zone.freeAbove) : null;
      break;
    }
  }

  // Weight surcharge: +€1 per kg above 2kg
  const weightKg = (weight || 0) / 1000;
  if (weightKg > 2) {
    rate += Math.ceil(weightKg - 2) * 1.0;
  }

  // Free shipping above threshold
  if (freeAbove && subtotal >= freeAbove) {
    rate = 0;
  }

  // Also check global free shipping setting
  const freeShippingSetting = await prisma.setting.findUnique({ where: { key: "freeShippingAbove" } });
  if (freeShippingSetting && subtotal >= parseFloat(freeShippingSetting.value)) {
    rate = 0;
  }

  return NextResponse.json({ shipping: Math.round(rate * 100) / 100 });
}
