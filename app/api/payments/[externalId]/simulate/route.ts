import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isMockPayment } from "@/lib/env";
import { signMockCallback } from "@/lib/payments/mockpay";
import { getPaymentProvider } from "@/lib/payments";
import { handlePaymentNotification } from "@/lib/orders";
import { jsonError } from "@/lib/http";
import crypto from "node:crypto";

type Ctx = { params: Promise<{ externalId: string }> };

/**
 * HANYA untuk sandbox (PAYMENT_PROVIDER=mockpay): mensimulasikan notifikasi
 * resmi gateway dengan menempuh jalur webhook yang sama — signature dibuat
 * lalu diverifikasi, payload diparse, dan diproses normal.
 */
export async function POST(req: Request, ctx: Ctx) {
  if (!isMockPayment()) {
    return jsonError(404, "NOT_FOUND", "Not found");
  }
  const { externalId } = await ctx.params;
  const payment = await prisma.payment.findUnique({ where: { externalId } });
  if (!payment) return jsonError(404, "NOT_FOUND", "Pembayaran tidak ditemukan");

  const { status = "PAID" } = (await req.json().catch(() => ({}))) as {
    status?: "PAID" | "FAILED" | "EXPIRED";
  };

  const rawBody = JSON.stringify({
    transaction_id: `TXN-${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
    external_id: externalId,
    status,
    amount: payment.amount,
  });

  // Jalur penuh: verify -> parse -> process, persis seperti webhook asli.
  const provider = getPaymentProvider();
  if (!provider.verifySignature(rawBody, signMockCallback(rawBody))) {
    return jsonError(500, "INTERNAL", "Signature sandbox tidak valid");
  }
  const result = await handlePaymentNotification({
    ...provider.parseNotification(rawBody),
    rawBody,
  });
  return NextResponse.json({ ok: true, result: result.kind });
}
