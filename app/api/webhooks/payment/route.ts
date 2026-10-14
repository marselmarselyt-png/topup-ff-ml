import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { handlePaymentNotification } from "@/lib/orders";

/**
 * Webhook notifikasi pembayaran resmi dari gateway.
 * Signature diverifikasi atas raw body; notifikasi berulang di-dedup.
 */
export async function POST(req: Request) {
  const provider = getPaymentProvider();
  const rawBody = await req.text();
  const signature =
    req.headers.get("x-signature") ?? req.headers.get("x-callback-signature");

  if (!provider.verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let notification;
  try {
    notification = provider.parseNotification(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const result = await handlePaymentNotification({
    ...notification,
    rawBody,
  });

  // Gateway mengharapkan 2xx untuk semua notifikasi yang sudah kami terima,
  // termasuk duplikat — supaya tidak terus di-retry.
  switch (result.kind) {
    case "paid":
    case "terminal":
      return NextResponse.json({ ok: true, orderId: result.orderId });
    case "duplicate":
      return NextResponse.json({ ok: true, duplicate: true });
    case "amount_mismatch":
      return NextResponse.json({ ok: true, flagged: "amount_mismatch" });
    case "not_found":
      return NextResponse.json({ error: "unknown external_id" }, { status: 404 });
  }
}
