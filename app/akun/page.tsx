import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatIDR, formatDateTime, gameLabel } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { AuthForms, LogoutButton } from "./AuthForms";

export default async function AkunPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Akun Pelanggan</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Masuk atau daftar untuk melihat riwayat transaksi Anda.
        </p>
        <AuthForms />
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{user.name}</h1>
          <p className="text-sm text-zinc-600">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-lg border border-violet-700 px-3 py-1.5 text-sm font-medium text-violet-700"
            >
              Dashboard Admin
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      <h2 className="mt-8 font-semibold text-zinc-900">Riwayat Transaksi</h2>
      {orders.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          Belum ada transaksi. <Link href="/" className="text-violet-700 underline">Top up sekarang</Link>.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-2">Kode</th>
                <th className="px-4 py-2">Game</th>
                <th className="px-4 py-2">Produk</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">
                    <Link
                      href={`/checkout/${o.orderCode}`}
                      className="font-mono text-violet-700 hover:underline"
                    >
                      {o.orderCode}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{gameLabel(o.game)}</td>
                  <td className="px-4 py-2">{o.productName}</td>
                  <td className="px-4 py-2">{formatIDR(o.total)}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-2 text-zinc-500">
                    {formatDateTime(o.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
