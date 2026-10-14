const STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-800",
  PAID: "bg-blue-100 text-blue-800",
  FULFILLING: "bg-indigo-100 text-indigo-800",
  SUCCESS: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-zinc-200 text-zinc-700",
  EXPIRED: "bg-zinc-200 text-zinc-700",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu Pembayaran",
  PAID: "Terbayar",
  FULFILLING: "Diproses Distributor",
  SUCCESS: "Berhasil",
  FAILED: "Gagal",
  REFUNDED: "Direfund",
  EXPIRED: "Kedaluwarsa",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        STYLES[status] ?? "bg-zinc-100 text-zinc-700"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
