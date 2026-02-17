const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  // Check image format in DB
  const samples = await prisma.product.findMany({
    select: { id: true, sku: true, images: true },
    take: 5
  });
  console.log('Sample images from DB:');
  for (const s of samples) {
    console.log(s.sku, ':', JSON.stringify(s.images));
  }

  // Count products with no images
  const noImages = await prisma.product.findMany({
    where: { images: { isEmpty: true } },
    select: { id: true, sku: true, nameEl: true }
  });
  console.log('\nProducts with empty images array:', noImages.length);

  // Count all files in products dir
  const files = fs.readdirSync('/home/aris/eshop/public/products');
  console.log('Files in public/products:', files.length);

  // Check products with images that are external URLs
  const allProducts = await prisma.product.findMany({
    select: { id: true, sku: true, nameEl: true, images: true }
  });

  let localImages = 0;
  let externalImages = 0;
  let missingLocal = [];

  for (const p of allProducts) {
    for (const img of (p.images || [])) {
      if (img.startsWith('http')) {
        externalImages++;
      } else {
        localImages++;
        const fullPath = path.join('/home/aris/eshop/public', img);
        if (!fs.existsSync(fullPath)) {
          missingLocal.push({ sku: p.sku, image: img });
        }
      }
    }
  }

  console.log('\nLocal image references:', localImages);
  console.log('External URL references:', externalImages);
  console.log('Missing local files:', missingLocal.length);
  if (missingLocal.length > 0) {
    console.log('\nMissing files:');
    for (const m of missingLocal) {
      console.log(m.sku, ':', m.image);
    }
  }

  // Check for files in public/products that are NOT referenced by any product
  const allImagePaths = new Set();
  for (const p of allProducts) {
    for (const img of (p.images || [])) {
      if (!img.startsWith('http')) {
        const filename = img.split('/').pop();
        allImagePaths.add(filename);
      }
    }
  }

  const orphanFiles = files.filter(f => !allImagePaths.has(f));
  console.log('\nOrphan files (in dir but not in DB):', orphanFiles.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
