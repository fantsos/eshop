const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ids = ["cmlqdx1ig00enwyiqqq7rcsr3","cmlqdx10m008lwyiqja29us0i","cmlqdx12n009dwyiqmw9iy8kr","cmlqdx133009jwyiqh35pmzzf","cmlqdx140009vwyiqgniwwp9e","cmlqdx1dz00d3wyiq0l0hg9mk","cmlqdx1e400d5wyiqeqrqp832","cmlqdx1e900d7wyiqckzm95lf","cmlqdx1i000ehwyiqm4oehnmw","cmlqdx24o00mpwyiqo8bpmjf6","cmlqdx31c00ypwyiqa8m51j3l","cmlqdx2sa00v9wyiqi7jbxqkv","cmlqdx2yy00xrwyiqxju57h8g","cmlqdx34600zrwyiq0sjh6bv3","cmlqdx34b00ztwyiq8e2bd611","cmlqdx3500103wyiqp89iop6g","cmlqdx3fu0149wyiqu8qb8oik","cmlqdx42g01crwyiqb0wvozcu","cmlqdx43301czwyiqt6dcpikp","cmlqdx5dd01tfwyiqqhhkji3v","cmlqdx5e101tnwyiq5twnpsm2","cmlqdx4al01ftwyiqarqbo9bz","cmlqdx4l801jjwyiqwwthsebe","cmlqdx4m001jtwyiqk80vj978","cmlqdx1ia00elwyiqzs54rac1","cmlqdx4p601kzwyiqcn6i10dm","cmlqdx50c01oxwyiqxljflgp0","cmlqdx58f01rpwyiq85fssazo","cmlqdx59o01s5wyiqr4inc8fu","cmlqdx5b701spwyiqqqcbfsw8","cmlqdx5fd01u5wyiqzonfn9mw","cmlqdx5iv01vfwyiq5hykpcmh","cmlqdx0ye007rwyiqukm6pu46","cmlqdx11d008vwyiq9ojssztk","cmlqdx12j009bwyiqi7aisi5y","cmlqdx145009xwyiqmclhoq3e","cmlqdx18600b3wyiqhhupabpn"];

async function main() {
  console.log('Deleting related data for', ids.length, 'products...');

  // Delete related records first
  const cartItems = await prisma.cartItem.deleteMany({ where: { productId: { in: ids } } });
  console.log('Deleted cart items:', cartItems.count);

  const orderItems = await prisma.orderItem.deleteMany({ where: { productId: { in: ids } } });
  console.log('Deleted order items:', orderItems.count);

  const reviews = await prisma.review.deleteMany({ where: { productId: { in: ids } } });
  console.log('Deleted reviews:', reviews.count);

  const wishlist = await prisma.wishlist.deleteMany({ where: { productId: { in: ids } } });
  console.log('Deleted wishlist items:', wishlist.count);

  const variants = await prisma.productVariant.deleteMany({ where: { productId: { in: ids } } });
  console.log('Deleted variants:', variants.count);

  // Now delete the products
  const products = await prisma.product.deleteMany({ where: { id: { in: ids } } });
  console.log('Deleted products:', products.count);

  // Verify
  const remaining = await prisma.product.count();
  console.log('\nRemaining products:', remaining);
}

main().catch(console.error).finally(() => prisma.$disconnect());
