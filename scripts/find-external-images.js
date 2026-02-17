const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allProducts = await prisma.product.findMany({
    select: { id: true, sku: true, nameEl: true, images: true }
  });

  const externalProducts = [];
  for (const p of allProducts) {
    const extImages = (p.images || []).filter(img => img.startsWith('http'));
    if (extImages.length > 0) {
      externalProducts.push({ id: p.id, sku: p.sku, nameEl: p.nameEl, images: extImages });
    }
  }

  console.log('Products with external image URLs:', externalProducts.length);
  console.log('---');
  for (const p of externalProducts) {
    console.log(p.id + ' | ' + p.sku + ' | ' + (p.nameEl || '').substring(0, 50) + ' | ' + p.images[0].substring(0, 80));
  }

  console.log('\n--- IDS ---');
  console.log(JSON.stringify(externalProducts.map(p => p.id)));
}

main().catch(console.error).finally(() => prisma.$disconnect());
