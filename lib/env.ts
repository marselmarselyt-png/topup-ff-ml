export const env = {
  businessName: process.env.BUSINESS_NAME ?? "TopUpKu",
  businessEmail: process.env.BUSINESS_EMAIL ?? "cs@topupku.local",
  businessWa: process.env.BUSINESS_WA ?? "6281200000000",
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "mockpay",
  webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? "dev-webhook-secret",
  distributorProvider: process.env.DISTRIBUTOR_PROVIDER ?? "mockdist",
  mockDistributorFail: process.env.MOCK_DISTRIBUTOR_FAIL === "1",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@topupku.local",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin12345",
};

/** True saat provider pembayaran adalah sandbox/mock. */
export function isMockPayment() {
  return env.paymentProvider === "mockpay";
}
