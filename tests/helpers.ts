import crypto from "node:crypto";
import { prisma } from "../lib/db";

export async function seedProduct(overrides: Partial<{
  sku: string;
  game: string;
  price: number;
  feeType: string;
  feeValue: number;
}> = {}) {
  const sku = overrides.sku ?? `TEST-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  return prisma.product.create({
    data: {
      game: overrides.game ?? "FF",
      sku,
      name: `${sku} Product`,
      diamonds: 100,
      basePrice: 5000,
      price: overrides.price ?? 7000,
      feeType: overrides.feeType ?? "flat",
      feeValue: overrides.feeValue ?? 1500,
      active: true,
    },
  });
}

export async function cleanup() {
  await prisma.auditLog.deleteMany();
  await prisma.fulfillment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany({ where: { sku: { startsWith: "TEST-" } } });
}
