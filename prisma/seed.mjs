import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FF_PRODUCTS = [
  { sku: "FF-50", name: "50 Diamond", diamonds: 50, basePrice: 6500, price: 7500 },
  { sku: "FF-70", name: "70 Diamond", diamonds: 70, basePrice: 8800, price: 9800 },
  { sku: "FF-140", name: "140 Diamond", diamonds: 140, basePrice: 17200, price: 19000 },
  { sku: "FF-355", name: "355 Diamond", diamonds: 355, basePrice: 43000, price: 47500 },
  { sku: "FF-720", name: "720 Diamond", diamonds: 720, basePrice: 86500, price: 94500 },
  { sku: "FF-1450", name: "1450 Diamond", diamonds: 1450, basePrice: 172000, price: 188000 },
];

const ML_PRODUCTS = [
  { sku: "ML-86", name: "86 Diamond (78+8 bonus)", diamonds: 86, basePrice: 18200, price: 20000 },
  { sku: "ML-172", name: "172 Diamond", diamonds: 172, basePrice: 36000, price: 39500 },
  { sku: "ML-257", name: "257 Diamond", diamonds: 257, basePrice: 54000, price: 59000 },
  { sku: "ML-344", name: "344 Diamond", diamonds: 344, basePrice: 71500, price: 78000 },
  { sku: "ML-514", name: "514 Diamond", diamonds: 514, basePrice: 107000, price: 117000 },
  { sku: "ML-1050", name: "1050 Diamond", diamonds: 1050, basePrice: 213000, price: 232000 },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@topupku.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin12345";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash: bcrypt.hashSync(adminPassword, 10),
      role: "admin",
    },
  });
  console.log(`Admin: ${adminEmail}`);

  const all = [
    ...FF_PRODUCTS.map((p, i) => ({ ...p, game: "FF", sortOrder: i })),
    ...ML_PRODUCTS.map((p, i) => ({ ...p, game: "ML", sortOrder: i })),
  ];
  for (const p of all) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, diamonds: p.diamonds, sortOrder: p.sortOrder },
      create: { ...p, feeType: "flat", feeValue: 1500, active: true },
    });
  }
  console.log(`Produk: ${all.length} item (FF ${FF_PRODUCTS.length}, ML ${ML_PRODUCTS.length})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
