import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { XMLParser } from "fast-xml-parser";

interface SyncResult {
  created: number;
  updated: number;
  deactivated: number;
  errors: string[];
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

export async function syncFeed(feedId: string): Promise<SyncResult> {
  const feed = await prisma.supplierFeed.findUnique({ where: { id: feedId } });
  if (!feed) throw new Error("Feed not found");

  const result: SyncResult = { created: 0, updated: 0, deactivated: 0, errors: [] };

  try {
    // Fetch XML
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(feed.url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const xml = await response.text();

    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      isArray: (name, jpath) => {
        // Ensure product array is always an array even with single item
        if (jpath === feed.productPath) return true;
        return false;
      },
    });
    const parsed = parser.parse(xml);

    // Navigate to product array
    const products = getNestedValue(parsed, feed.productPath);
    if (!Array.isArray(products)) {
      throw new Error(`No product array found at path: ${feed.productPath}`);
    }

    const mapping = feed.fieldMapping as Record<string, string>;
    const markupMultiplier = feed.markupPercent
      ? 1 + Number(feed.markupPercent) / 100
      : 1;

    // Load categories for name lookup
    const categories = await prisma.category.findMany({
      where: { isActive: true },
    });
    const categoryByName = new Map<string, string>();
    for (const cat of categories) {
      categoryByName.set(cat.nameEl.toLowerCase(), cat.id);
      categoryByName.set(cat.nameEn.toLowerCase(), cat.id);
    }

    const processedSkus = new Set<string>();

    for (const xmlProduct of products) {
      try {
        const getValue = (field: string): string | undefined => {
          const xmlTag = mapping[field];
          if (!xmlTag) return undefined;
          const val = xmlProduct[xmlTag];
          return val !== undefined && val !== null ? String(val) : undefined;
        };

        const sku = getValue("sku");
        if (!sku) {
          result.errors.push("Skipped product with no SKU");
          continue;
        }

        processedSkus.add(sku);

        const nameEl = getValue("nameEl") || sku;
        const nameEn = getValue("nameEn") || nameEl;
        const rawPrice = getValue("price");
        const price = rawPrice ? Math.round(parseFloat(rawPrice) * markupMultiplier * 100) / 100 : 0;
        const stock = getValue("stock") ? parseInt(getValue("stock")!, 10) : 0;
        const descriptionEl = getValue("descriptionEl") || null;
        const descriptionEn = getValue("descriptionEn") || null;
        const brand = getValue("brand") || null;
        const weight = getValue("weight") ? parseFloat(getValue("weight")!) : null;
        const imageUrl = getValue("image") || null;
        const images = imageUrl ? [imageUrl] : [];

        // Category lookup
        let categoryId = feed.defaultCategoryId || null;
        const categoryName = getValue("category");
        if (categoryName) {
          const found = categoryByName.get(categoryName.toLowerCase());
          if (found) categoryId = found;
        }

        // Generate unique slug
        let slug = slugify(nameEl);
        if (!slug) slug = slugify(sku);

        // Upsert product
        const existing = await prisma.product.findFirst({
          where: { supplierFeedId: feed.id, supplierSku: sku },
        });

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              nameEl,
              nameEn,
              price,
              stock,
              descriptionEl,
              descriptionEn,
              brand,
              weight,
              images: images.length > 0 ? images : undefined,
              categoryId,
              isActive: true,
            },
          });
          result.updated++;
        } else {
          // Ensure unique slug
          const slugExists = await prisma.product.findUnique({ where: { slug } });
          if (slugExists) slug = `${slug}-${sku.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
          // Ensure unique SKU - prefix with feed name if needed
          const skuValue = `SF-${sku}`;
          const skuExists = await prisma.product.findUnique({ where: { sku: skuValue } });
          const finalSku = skuExists ? `SF-${feed.id.slice(0, 4)}-${sku}` : skuValue;

          await prisma.product.create({
            data: {
              sku: finalSku,
              nameEl,
              nameEn,
              slug,
              descriptionEl,
              descriptionEn,
              price,
              stock,
              brand,
              weight,
              images,
              categoryId,
              isActive: true,
              supplierFeedId: feed.id,
              supplierSku: sku,
            },
          });
          result.created++;
        }
      } catch (err: any) {
        result.errors.push(`Product error: ${err.message}`);
      }
    }

    // Deactivate products from this feed that are no longer in XML
    const feedProducts = await prisma.product.findMany({
      where: { supplierFeedId: feed.id, isActive: true },
      select: { id: true, supplierSku: true },
    });

    const toDeactivate = feedProducts.filter(
      (p) => p.supplierSku && !processedSkus.has(p.supplierSku)
    );

    if (toDeactivate.length > 0) {
      await prisma.product.updateMany({
        where: { id: { in: toDeactivate.map((p) => p.id) } },
        data: { isActive: false },
      });
      result.deactivated = toDeactivate.length;
    }

    // Update feed status
    await prisma.supplierFeed.update({
      where: { id: feed.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "success",
        lastSyncMessage: `Created: ${result.created}, Updated: ${result.updated}, Deactivated: ${result.deactivated}${result.errors.length > 0 ? `, Errors: ${result.errors.length}` : ""}`,
      },
    });
  } catch (err: any) {
    await prisma.supplierFeed.update({
      where: { id: feed.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "error",
        lastSyncMessage: err.message,
      },
    });
    throw err;
  }

  return result;
}
