export interface CreatePaymentRequest {
  orderCode: string;
  amount: number;
}

export interface CreatedPayment {
  externalId: string; // referensi kita di gateway
  method: string; // QRIS, EWALLET, dst
  qrPayload?: string; // payload untuk dirender jadi QR
}

/** Payload notifikasi resmi dari payment gateway (setelah diverifikasi). */
export interface PaymentNotification {
  transactionId: string;
  externalId: string;
  status: "PAID" | "FAILED" | "EXPIRED";
  amount: number;
}

/**
 * Kontrak payment gateway (Midtrans, Xendit, Tripay, dsb).
 * Implementasi baru cukup memenuhi interface ini lalu didaftarkan di index.ts.
 */
export interface PaymentProvider {
  name: string;
  createPayment(req: CreatePaymentRequest): Promise<CreatedPayment>;
  /**
   * Verifikasi signature notifikasi gateway.
   * signature: header signature dari request; rawBody: body mentah.
   */
  verifySignature(rawBody: string, signature: string | null): boolean;
  /** Ubah raw body notifikasi menjadi PaymentNotification ter-normalisasi. */
  parseNotification(rawBody: string): PaymentNotification;
}
