import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatIDR, formatDateTime, gameLabel } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { ProductEditor } from "./ProductEditor";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/akun");
  if (user.role !== "admin") redirect("/akun");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [orders, products, byStatus, revenueAgg, todayCount, customerCount] =
    await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { email: true } } },
      }),
      prisma.product.findMany({ orderBy: [{ game: "asc" }, { sortOrder: "asc" }] }),
      prisma.order.groupBy({ by: ["status"], _count: true }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "SUCCESS" },
      }),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { role: "customer" } }),
    ]);

  const statusCount = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard Admin</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pendapatan (sukses)" value={formatIDR(revenueAgg._sum.total ?? 0)} />
        <StatCard label="Order hari ini" value={String(todayCount)} />
        <StatCard label="Order sukses" value={String(statusCount["SUCCESS"] ?? 0)} />
        <StatCard label="Pelanggan" value={String(customerCount)} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {Object.entries(statusCount).map(([s, c]) => (
          <span key={s} className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">
            {s}: {c}
          </span>
        ))}
      </div>

      <h2 className="mt-8 font-semibold text-zinc-900">Pesanan Terbaru</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-3 py-2">Kode</th>
              <th className="px-3 py-2">Game/ID</th>
              <th className="px-3 py-2">Produk</th>
              <th className="px-3 py-2">Pelanggan</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-zinc-100">
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-mono text-violet-700 hover:underline"
                  >
                    {o.orderCode}
                  </Link>
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {gameLabel(o.game)} {o.gameUserId}
                  {o.gameZoneId ? ` (${o.gameZoneId})` : ""}
                </td>
                <td className="px-3 py-2">{o.productName}</td>
                <td className="px-3 py-2 text-zinc-600">{o.user?.email ?? "guest"}</td>
                <td className="px-3 py-2">{formatIDR(o.total)}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-3 py-2 text-zinc-500">{formatDateTime(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 font-semibold text-zinc-900">Produk & Harga</h2>
      <ProductEditor products={products} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-zinc-900">{value}</p>
    </div>
  );
}
