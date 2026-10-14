import { describe, it, expect, beforeEach, afterAll } from "vitest";
import crypto from "node:crypto";
import { prisma } from "../lib/db";
import {
  canTransition,
  createOrder,
  OrderError,
} from "../lib/orders";
import { seedProduct, cleanup } from "./helpers";

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("state machine", () => {
  it("hanya transisi legal yang diizinkan", () => {
    expect(canTransition("PENDING_PAYMENT", "PAID")).toBe(true);
    expect(canTransition("PAID", "FULFILLING")).toBe(true);
    expect(canTransition("FULFILLING", "SUCCESS")).toBe(true);
    expect(canTransition("FAILED", "REFUNDED")).toBe(true);
    // ilegal:
    expect(canTransition("PENDING_PAYMENT", "SUCCESS")).toBe(false);
    expect(canTransition("SUCCESS", "PAID")).toBe(false);
    expect(canTransition("REFUNDED", "FULFILLING")).toBe(false);
    expect(canTransition("EXPIRED", "PAID")).toBe(false);
  });
});

describe("createOrder", () => {
  it("membuat order PENDING_PAYMENT + tagihan, snapshot harga", async () => {
    const p = await seedProduct({ price: 10000, feeValue: 2000 });
    const order = await createOrder({
      productId: p.id,
      gameUserId: "12345678",
      idempotencyKey: crypto.randomUUID(),
    });
    expect(order.status).toBe("PENDING_PAYMENT");
    expect(order.price).toBe(10000);
    expect(order.fee).toBe(2000);
    expect(order.total).toBe(12000);
    expect(order.payment?.status).toBe("PENDING");
    expect(order.payment?.amount).toBe(12000);
    expect(order.orderCode).toMatch(/^TRX-/);
  });

  it("idempotent: key sama mengembalikan order yang sama, bukan duplikat", async () => {
    const p = await seedProduct();
    const key = crypto.randomUUID();
    const first = await createOrder({
      productId: p.id,
      gameUserId: "12345678",
      idempotencyKey: key,
    });
    const second = await createOrder({
      productId: p.id,
      gameUserId: "12345678",
      idempotencyKey: key,
    });
    expect(second.orderCode).toBe(first.orderCode);
    expect(await prisma.order.count()).toBe(1);
    expect(await prisma.payment.count()).toBe(1);
  });

  it("menolak ID game tidak valid dan produk nonaktif", async () => {
    const p = await seedProduct();
    await expect(
      createOrder({
        productId: p.id,
        gameUserId: "bukan-angka",
        idempotencyKey: crypto.randomUUID(),
      })
    ).rejects.toBeInstanceOf(OrderError);

    await prisma.product.update({ where: { id: p.id }, data: { active: false } });
    await expect(
      createOrder({
        productId: p.id,
        gameUserId: "12345678",
        idempotencyKey: crypto.randomUUID(),
      })
    ).rejects.toMatchObject({ code: "PRODUCT_NOT_FOUND" });
  });
});
