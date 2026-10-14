import { describe, it, expect, beforeEach, afterAll } from "vitest";
import crypto from "node:crypto";
import { prisma } from "../lib/db";
import { createOrder, handlePaymentNotification } from "../lib/orders";
import { mockpay, signMockCallback } from "../lib/payments/mockpay";
import { seedProduct, cleanup } from "./helpers";

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function makeOrder() {
  const p = await seedProduct({ price: 9000, feeValue: 1000 });
  const order = await createOrder({
    productId: p.id,
    gameUserId: "12345678",
    idempotencyKey: crypto.randomUUID(),
  });
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { orderId: order.id },
  });
  return { order, payment };
}

function notification(payment: { externalId: string; amount: number }, status = "PAID") {
  return {
    transactionId: `TXN-${crypto.randomBytes(6).toString("hex")}`,
    externalId: payment.externalId,
    status: status as "PAID" | "FAILED" | "EXPIRED",
    amount: payment.amount,
    rawBody: "{}",
  };
}

describe("verifySignature", () => {
  it("menerima signature valid, menolak yang salah/hilang", () => {
    const body = JSON.stringify({ a: 1 });
    const sig = signMockCallback(body);
    expect(mockpay.verifySignature(body, sig)).toBe(true);
    expect(mockpay.verifySignature(body, "sha256=deadbeef")).toBe(false);
    expect(mockpay.verifySignature(body, null)).toBe(false);
    expect(mockpay.verifySignature(body + "x", sig)).toBe(false);
  });
});

describe("handlePaymentNotification", () => {
  it("PAID → order SUCCESS dengan SN, payment PAID, audit trail lengkap", async () => {
    const { order, payment } = await makeOrder();
    const res = await handlePaymentNotification(notification(payment));
    expect(res.kind).toBe("paid");

    const o = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { payment: true, fulfillments: true, auditLogs: true },
    });
    expect(o.status).toBe("SUCCESS");
    expect(o.payment?.status).toBe("PAID");
    expect(o.payment?.transactionId).toBeTruthy();
    expect(o.fulfillments).toHaveLength(1);
    expect(o.fulfillments[0].status).toBe("SUCCESS");
    expect(o.fulfillments[0].serialNo).toMatch(/^SN-/);
    const actions = o.auditLogs.map((l) => l.action);
    expect(actions).toContain("order:created");
    expect(actions).toContain("status:PENDING_PAYMENT->PAID");
    expect(actions).toContain("status:FULFILLING->SUCCESS");
  });

  it("notifikasi berulang di-dedup: tidak memproses ulang / double fulfill", async () => {
    const { order, payment } = await makeOrder();
    const n = notification(payment);
    await handlePaymentNotification(n);
    // replay transactionId yang sama
    const dup = await handlePaymentNotification(n);
    expect(dup.kind).toBe("duplicate");
    // notifikasi baru untuk pembayaran yang sudah PAID
    const dup2 = await handlePaymentNotification(notification(payment));
    expect(dup2.kind).toBe("duplicate");

    expect(await prisma.order.count()).toBe(1);
    expect(await prisma.fulfillment.count()).toBe(1);
    const o = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(o.status).toBe("SUCCESS");
  });

  it("FAILED → order FAILED, tidak ada fulfillment", async () => {
    const { order, payment } = await makeOrder();
    const res = await handlePaymentNotification(notification(payment, "FAILED"));
    expect(res.kind).toBe("terminal");
    const o = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(o.status).toBe("FAILED");
    expect(await prisma.fulfillment.count()).toBe(0);
  });

  it("amount tidak cocok → diflag, order tetap menunggu", async () => {
    const { order, payment } = await makeOrder();
    const n = { ...notification(payment), amount: payment.amount + 1 };
    const res = await handlePaymentNotification(n);
    expect(res.kind).toBe("amount_mismatch");
    const o = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { payment: true },
    });
    expect(o.status).toBe("PENDING_PAYMENT");
    expect(o.payment?.status).toBe("PENDING");
  });

  it("external_id tidak dikenal → not_found", async () => {
    const res = await handlePaymentNotification(
      notification({ externalId: "PAY-NOPE", amount: 100 })
    );
    expect(res.kind).toBe("not_found");
  });
});
