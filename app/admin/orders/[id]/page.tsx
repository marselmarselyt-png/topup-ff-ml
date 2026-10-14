import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatIDR, formatDateTime, gameLabel } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderActions } from "./OrderActions";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/akun");

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      payment: true,
      fulfillments: { orderBy: { createdAt: "desc" } },
      auditLogs: { orderBy: { createdAt: "asc" } },
      product: { select: { sku: true } },
    },
  });
  if (!order) notFound();

  const row = "flex justify-between gap-4 text-sm py-1";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="text-sm text-violet-700 hover:underline">
        ← Kembali ke dashboard
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <h1 className="font-mono text-xl font-bold text-zinc-900">
          {order.orderCode}
        </h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold text-zinc-900">Pesanan</h2>
          <div className="mt-2">
            <div className={row}>
              <span className="text-zinc-500">Game</span>
              <span>{gameLabel(order.game)}</span>
            </div>
            <div className={row}>
              <span className="text-zinc-500">ID Game</span>
              <span className="font-mono">
                {order.gameUserId}
                {order.gameZoneId ? ` (${order.gameZoneId})` : ""}
              </span>
            </div>
            <div className={row}>
              <span className="text-zinc-500">Produk</span>
              <span>
                {order.productName} ({order.product.sku})
              </span>
            </div>
            <div className={row}>
              <span className="text-zinc-500">Pelanggan</span>
              <span>{order.user?.email ?? "guest"}</span>
            </div>
            <div className={row}>
              <span className="text-zinc-500">Harga + fee</span>
              <span>
                {formatIDR(order.price)} + {formatIDR(order.fee)} ={" "}
                <b>{formatIDR(order.total)}</b>
              </span>
            </div>
            <div className={row}>
              <span className="text-zinc-500">Dibuat</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold text-zinc-900">Pembayaran</h2>
          {order.payment ? (
            <div className="mt-2">
              <div className={row}>
                <span className="text-zinc-500">Provider/Metode</span>
                <span>
                  {order.payment.provider} / {order.payment.method}
                </span>
              </div>
              <div className={row}>
                <span className="text-zinc-500">Ref</span>
                <span className="font-mono text-xs">{order.payment.externalId}</span>
              </div>
              <div className={row}>
                <span className="text-zinc-500">Tx ID gateway</span>
                <span className="font-mono text-xs">
                  {order.payment.transactionId ?? "—"}
                </span>
              </div>
              <div className={row}>
                <span className="text-zinc-500">Status</span>
                <span>{order.payment.status}</span>
              </div>
              <div className={row}>
                <span className="text-zinc-500">Dibayar</span>
                <span>
                  {order.payment.paidAt
                    ? formatDateTime(order.payment.paidAt)
                    : "—"}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">Belum ada pembayaran.</p>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">Fulfillment Distributor</h2>
        {order.fulfillments.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Belum ada percobaan.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {order.fulfillments.map((f) => (
              <div key={f.id} className="rounded-lg bg-zinc-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {f.provider} — {f.status}
                  </span>
                  <span className="text-zinc-500">{formatDateTime(f.createdAt)}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-zinc-600">
                  ref={f.refId ?? "—"} sn={f.serialNo ?? "—"}
                </p>
                {f.message && (
                  <p className="mt-1 text-xs text-red-600">{f.message}</p>
                )}
              </div>
            ))}
          </div>
        )}
        <OrderActions orderId={order.id} status={order.status} />
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">Audit Trail</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {order.auditLogs.map((l) => (
            <li key={l.id} className="flex gap-3">
              <span className="w-36 shrink-0 text-zinc-500">
                {formatDateTime(l.createdAt)}
              </span>
              <span className="w-28 shrink-0 font-medium">{l.actor}</span>
              <span>
                {l.action}
                {l.detail ? (
                  <span className="text-zinc-500"> — {l.detail}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
