import { env } from "../env";
import { mockpay } from "./mockpay";
import type { PaymentProvider } from "./types";

const providers: Record<string, PaymentProvider> = {
  mockpay,
  // Daftarkan gateway sungguhan di sini, mis. midtrans, xendit, tripay.
};

export function getPaymentProvider(): PaymentProvider {
  const p = providers[env.paymentProvider];
  if (!p) {
    throw new Error(
      `PAYMENT_PROVIDER "${env.paymentProvider}" tidak dikenal`
    );
  }
  return p;
}
