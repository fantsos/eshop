import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@eshop.fantsos.gr" },
    update: {},
    create: {
      email: "admin@eshop.fantsos.gr",
      name: "Admin",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { nameEn: "Electronics", nameEl: "Ηλεκτρονικά", slug: "electronics", order: 1 },
  });

  const smartphones = await prisma.category.upsert({
    where: { slug: "smartphones" },
    update: {},
    create: { nameEn: "Smartphones", nameEl: "Κινητά", slug: "smartphones", parentId: electronics.id, order: 1 },
  });

  const laptops = await prisma.category.upsert({
    where: { slug: "laptops" },
    update: {},
    create: { nameEn: "Laptops", nameEl: "Φορητοί Υπολογιστές", slug: "laptops", parentId: electronics.id, order: 2 },
  });

  const home = await prisma.category.upsert({
    where: { slug: "home-garden" },
    update: {},
    create: { nameEn: "Home & Garden", nameEl: "Σπίτι & Κήπος", slug: "home-garden", order: 2 },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: "fashion" },
    update: {},
    create: { nameEn: "Fashion", nameEl: "Μόδα", slug: "fashion", order: 3 },
  });

  // Create sample products
  const products = [
    { nameEn: "Wireless Bluetooth Headphones", nameEl: "Ασύρματα Ακουστικά Bluetooth", sku: "WBH-001", slug: "wireless-bluetooth-headphones", price: 29.99, compareAtPrice: 49.99, brand: "SoundMax", stock: 150, categoryId: electronics.id, isFeatured: true, descriptionEn: "Premium wireless headphones with noise cancellation and 30-hour battery life.", descriptionEl: "Ασύρματα ακουστικά premium με ακύρωση θορύβου και μπαταρία 30 ωρών." },
    { nameEn: "Smart Watch Pro", nameEl: "Έξυπνο Ρολόι Pro", sku: "SWP-001", slug: "smart-watch-pro", price: 89.99, compareAtPrice: 129.99, brand: "TechWear", stock: 75, categoryId: electronics.id, isFeatured: true, descriptionEn: "Advanced smartwatch with health monitoring, GPS, and water resistance.", descriptionEl: "Προηγμένο smartwatch με παρακολούθηση υγείας, GPS και αδιαβροχοποίηση." },
    { nameEn: "USB-C Hub 7-in-1", nameEl: "USB-C Hub 7-σε-1", sku: "UCH-001", slug: "usb-c-hub-7in1", price: 24.99, brand: "ConnectPro", stock: 200, categoryId: laptops.id, descriptionEn: "Multi-port USB-C hub with HDMI, USB 3.0, SD card reader.", descriptionEl: "Hub πολλαπλών θυρών USB-C με HDMI, USB 3.0, αναγνώστη καρτών SD." },
    { nameEn: "Phone Case - Clear", nameEl: "Θήκη Κινητού - Διάφανη", sku: "PC-001", slug: "phone-case-clear", price: 9.99, brand: "ShieldCase", stock: 500, categoryId: smartphones.id, descriptionEn: "Crystal clear protective case with shock absorption.", descriptionEl: "Κρυστάλλινα διάφανη προστατευτική θήκη με απορρόφηση κραδασμών." },
    { nameEn: "LED Desk Lamp", nameEl: "LED Λάμπα Γραφείου", sku: "LDL-001", slug: "led-desk-lamp", price: 34.99, compareAtPrice: 44.99, brand: "BrightHome", stock: 100, categoryId: home.id, isFeatured: true, descriptionEn: "Adjustable LED desk lamp with 5 brightness levels and USB charging.", descriptionEl: "Ρυθμιζόμενη LED λάμπα γραφείου με 5 επίπεδα φωτεινότητας και USB φόρτιση." },
    { nameEn: "Cotton T-Shirt Classic", nameEl: "Βαμβακερό T-Shirt Classic", sku: "CTS-001", slug: "cotton-tshirt-classic", price: 14.99, brand: "ComfortWear", stock: 300, categoryId: fashion.id, descriptionEn: "100% cotton classic fit t-shirt available in multiple colors.", descriptionEl: "100% βαμβακερό t-shirt κλασικής εφαρμογής σε πολλά χρώματα." },
    { nameEn: "Portable Charger 20000mAh", nameEl: "Φορητός Φορτιστής 20000mAh", sku: "PCH-001", slug: "portable-charger-20000", price: 19.99, compareAtPrice: 29.99, brand: "PowerBank", stock: 250, categoryId: electronics.id, isFeatured: true, descriptionEn: "High capacity portable charger with fast charging support.", descriptionEl: "Φορητός φορτιστής υψηλής χωρητικότητας με υποστήριξη γρήγορης φόρτισης." },
    { nameEn: "Mechanical Keyboard RGB", nameEl: "Μηχανικό Πληκτρολόγιο RGB", sku: "MKR-001", slug: "mechanical-keyboard-rgb", price: 59.99, compareAtPrice: 79.99, brand: "KeyMaster", stock: 80, categoryId: electronics.id, flashSalePrice: 44.99, flashSaleStart: new Date(), flashSaleEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), descriptionEn: "Full-size mechanical keyboard with RGB backlighting and hot-swappable switches.", descriptionEl: "Μηχανικό πληκτρολόγιο πλήρους μεγέθους με RGB φωτισμό." },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p as any,
    });
  }

  // Create a coupon
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", type: "PERCENTAGE", value: 10, minOrder: 20, isActive: true },
  });

  await prisma.coupon.upsert({
    where: { code: "SAVE5" },
    update: {},
    create: { code: "SAVE5", type: "FIXED", value: 5, minOrder: 30, isActive: true },
  });

  // Create shipping zones
  const existingZones = await prisma.shippingZone.count();
  if (existingZones === 0) {
    await prisma.shippingZone.createMany({
      data: [
        { name: "Athens / Thessaloniki", regions: ["10", "11", "12", "13", "14", "15", "16", "17", "18", "54", "55", "56"], rate: 3.50, freeAbove: 50 },
        { name: "Rest of Greece", regions: ["*"], rate: 4.99, freeAbove: 70 },
        { name: "Islands", regions: ["28", "29", "31", "34", "37", "49", "63", "69", "70", "71", "72", "73", "74", "80", "81", "82", "83", "84", "85"], rate: 6.99, freeAbove: 100 },
      ],
    });
  }

  // Create default settings
  const defaultSettings = [
    { key: "storeName", value: "E-Shop" },
    { key: "storeEmail", value: "info@eshop.fantsos.gr" },
    { key: "storePhone", value: "+30 210 0000000" },
    { key: "currency", value: "EUR" },
    { key: "taxRate", value: "24" },
    { key: "freeShippingAbove", value: "50" },
    { key: "codFee", value: "2.50" },
  ];
  for (const s of defaultSettings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  console.log("Seed completed!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
