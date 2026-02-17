import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { XMLParser } from "fast-xml-parser";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[&]/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

function parsePrice(priceStr: string): number {
  if (!priceStr || typeof priceStr !== "string") return 0;
  const cleaned = priceStr.replace(/[^0-9.,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function cleanHtml(html: string): string {
  if (!html) return "";
  // Decode HTML entities
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function main() {
  const xmlPath = path.join(__dirname, "../xmls/netconnect_pricelist_32026-02-17.xml");
  const xmlContent = fs.readFileSync(xmlPath, "utf-8");

  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => name === "product",
    textNodeName: "_text",
  });

  const parsed = parser.parse(xmlContent);
  const products = parsed.products.product;

  console.log(`Found ${products.length} products in XML`);

  // Step 1: Delete all existing products and related data
  console.log("\n--- Deleting existing data ---");

  // Delete in correct order due to foreign keys
  const deletedCartItems = await prisma.cartItem.deleteMany({});
  console.log(`Deleted ${deletedCartItems.count} cart items`);

  const deletedWishlist = await prisma.wishlist.deleteMany({});
  console.log(`Deleted ${deletedWishlist.count} wishlist items`);

  const deletedReviews = await prisma.review.deleteMany({});
  console.log(`Deleted ${deletedReviews.count} reviews`);

  const deletedOrderItems = await prisma.orderItem.deleteMany({});
  console.log(`Deleted ${deletedOrderItems.count} order items`);

  const deletedVariants = await prisma.productVariant.deleteMany({});
  console.log(`Deleted ${deletedVariants.count} product variants`);

  const deletedProducts = await prisma.product.deleteMany({});
  console.log(`Deleted ${deletedProducts.count} products`);

  const deletedCategories = await prisma.category.deleteMany({});
  console.log(`Deleted ${deletedCategories.count} categories`);

  // Step 2: Create categories from XML
  console.log("\n--- Creating categories ---");

  const categoryMap = new Map<string, string>(); // category name -> category id
  const uniqueCategories = new Set<string>();

  for (const p of products) {
    const cat = p.category;
    if (cat && typeof cat === "string" && cat.trim()) {
      uniqueCategories.add(cat.trim());
    }
  }

  let catOrder = 0;
  for (const catName of Array.from(uniqueCategories).sort()) {
    catOrder++;
    const slug = slugify(catName);
    const category = await prisma.category.create({
      data: {
        nameEn: catName,
        nameEl: catName, // Same name since XML is in English
        slug: slug,
        order: catOrder,
        isActive: true,
      },
    });
    categoryMap.set(catName, category.id);
    console.log(`  Created category: ${catName} (${slug})`);
  }

  console.log(`Created ${categoryMap.size} categories`);

  // Step 3: Import products
  console.log("\n--- Importing products ---");

  let imported = 0;
  let skipped = 0;
  const usedSlugs = new Set<string>();
  const usedSkus = new Set<string>();

  for (const p of products) {
    try {
      const title = (p.title || "").toString().trim();
      if (!title) {
        skipped++;
        continue;
      }

      // Generate unique SKU
      let sku = (p.sku || p.internal_code || `NC-${p.id}`).toString().trim();
      if (usedSkus.has(sku)) {
        sku = `${sku}-${p.id}`;
      }
      usedSkus.add(sku);

      // Generate unique slug
      let slug = slugify(title);
      if (!slug) slug = `product-${p.id}`;
      if (usedSlugs.has(slug)) {
        slug = `${slug}-${p.id}`;
      }
      usedSlugs.add(slug);

      const price = parsePrice((p.price || "0").toString());
      const rrpPrice = parsePrice((p.rrp || "").toString());
      const stock = parseInt(p.stock) || 0;
      const weight = parseFloat(p.weight) || null;
      const description = cleanHtml((p.description || "").toString());
      const categoryName = (p.category || "").toString().trim();
      const categoryId = categoryMap.get(categoryName) || null;
      const manufacturer = (p.manufacturer || "").toString().trim() || null;
      const imageUrl = (p.image_link || "").toString().trim();
      const images = imageUrl ? [imageUrl] : [];
      const ean = (p.ean || "").toString().trim();
      const mpn = (p.mpn || "").toString().trim();
      const warranty = (p.warranty || "").toString().trim();

      // Build specs from extra fields
      const specs: Record<string, string> = {};
      if (ean) specs.ean = ean;
      if (mpn) specs.mpn = mpn;
      if (warranty && warranty !== "0") specs.warranty = warranty;
      if (p.upc) specs.upc = p.upc.toString().trim();
      if (p.link) specs.supplierUrl = p.link.toString().trim();
      if (p.internal_code) specs.internalCode = p.internal_code.toString().trim();

      await prisma.product.create({
        data: {
          sku,
          nameEn: title,
          nameEl: title, // Same as English since supplier data is in English
          slug,
          descriptionEn: description || null,
          descriptionEl: description || null,
          price,
          compareAtPrice: rrpPrice > price ? rrpPrice : null,
          brand: manufacturer,
          stock,
          weight,
          images,
          specs: Object.keys(specs).length > 0 ? specs : undefined,
          isActive: stock > 0,
          isFeatured: false,
          categoryId,
        },
      });

      imported++;
      if (imported % 100 === 0) {
        console.log(`  Imported ${imported}/${products.length}...`);
      }
    } catch (error: any) {
      console.error(`  Error importing product ${p.id} (${p.title}): ${error.message}`);
      skipped++;
    }
  }

  console.log(`\n--- Import complete ---`);
  console.log(`Total in XML: ${products.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped/Errors: ${skipped}`);
  console.log(`Categories created: ${categoryMap.size}`);
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
