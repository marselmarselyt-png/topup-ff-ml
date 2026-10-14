import crypto from "node:crypto";
import { env } from "../env";
import { paymentCallbackSchema } from "../validators";
import type {
  CreatePaymentRequest,
  CreatedPayment,
  PaymentNotification,
  PaymentProvider,
} from "./types";

function sign(body: string, secret: string): string {
  return `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
}

/** Utility untuk simulator sandbox — membuat signature valid atas body. */
export function signMockCallback(body: string): string {
  return sign(body, env.webhookSecret);
}

/**
 * Payment gateway sandbox. Notifikasi ditandatangani HMAC-SHA256 pada raw body,
 * dikirim via header `x-signature: sha256=<hex>` — pola yang sama dipakai
 * gateway sungguhan (Midtrans/Xendit).
 */
export const mockpay: PaymentProvider = {
  name: "mockpay",

  async createPayment(req: CreatePaymentRequest): Promise<CreatedPayment> {
    const externalId = `PAY-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
    return {
      externalId,
      method: "QRIS",
      qrPayload: `QRIS-SANDBOX|${externalId}|${req.orderCode}|${req.amount}`,
    };
  },

  verifySignature(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    const expected = sign(rawBody, env.webhookSecret);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  },

  parseNotification(rawBody: string): PaymentNotification {
    const parsed = paymentCallbackSchema.parse(JSON.parse(rawBody));
    return {
      transactionId: parsed.transaction_id,
      externalId: parsed.external_id,
      status: parsed.status,
      amount: parsed.amount,
    };
  },
};
