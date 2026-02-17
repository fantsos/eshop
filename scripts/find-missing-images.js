const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.product.count();
  console.log('Total products:', count);

  const products = await prisma.product.findMany({
    select: { id: true, nameEl: true, images: true, sku: true }
  });

  const grouped = {};

  for (const p of products) {
    if (p.images && p.images.length > 0) {
      for (const img of p.images) {
        const filename = img.split('/').pop() || '';
        const filePath = path.join('/home/aris/eshop/public/products', filename);
        const exists = fs.existsSync(filePath);
        if (filename && !exists) {
          if (!grouped[p.id]) grouped[p.id] = { nameEl: p.nameEl, sku: p.sku, images: [] };
          grouped[p.id].images.push(filename);
        }
      }
    }
  }

  const ids = Object.keys(grouped);
  console.log('Unique products with missing images:', ids.length);
  console.log('---');
  for (const [id, data] of Object.entries(grouped)) {
    console.log(id + ' | ' + data.sku + ' | ' + data.nameEl.substring(0, 60) + ' | missing: ' + data.images.join(', '));
  }

  // Output IDs for deletion
  console.log('\n--- IDS TO DELETE ---');
  console.log(JSON.stringify(ids));
}

main().catch(console.error).finally(() => prisma.$disconnect());
