import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { formatIDR, gameLabel } from "@/lib/format";
import { isMockPayment } from "@/lib/env";
import { PaymentBox } from "./PaymentBox";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const order = await prisma.order.findUnique({
    where: { orderCode: code.toUpperCase() },
    include: { payment: true },
  });
  if (!order) notFound();

  let qrDataUrl: string | null = null;
  if (order.payment?.qrPayload && order.status === "PENDING_PAYMENT") {
    qrDataUrl = await QRCode.toDataURL(order.payment.qrPayload, {
      width: 260,
      margin: 1,
    });
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h1 className="text-xl font-bold text-zinc-900">Pembayaran</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kode transaksi: <span className="font-mono">{order.orderCode}</span>
        </p>

        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-600">Game</dt>
            <dd>{gameLabel(order.game)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-600">ID</dt>
            <dd className="font-mono">
              {order.gameUserId}
              {order.gameZoneId ? ` (${order.gameZoneId})` : ""}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-600">Produk</dt>
            <dd>{order.productName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-600">Harga</dt>
            <dd>{formatIDR(order.price)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-600">Biaya admin</dt>
            <dd>{formatIDR(order.fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatIDR(order.total)}</dd>
          </div>
        </dl>

        {qrDataUrl && (
          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-zinc-700">
              Scan QRIS untuk membayar {formatIDR(order.total)}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QRIS pembayaran"
              className="mx-auto mt-3 rounded-xl border border-zinc-200"
              width={260}
              height={260}
            />
            <p className="mt-2 font-mono text-xs text-zinc-500">
              Ref: {order.payment?.externalId}
            </p>
          </div>
        )}

        <PaymentBox
          orderCode={order.orderCode}
          initialStatus={order.status}
          mockPayment={isMockPayment()}
          externalId={order.payment?.externalId ?? null}
        />
      </div>
    </div>
  );
}
