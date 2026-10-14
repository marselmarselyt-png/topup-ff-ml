import { TransaksiLookup } from "./TransaksiLookup";

export default function TransaksiPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">Cek Status Transaksi</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Masukkan kode transaksi (mis. TRX-AB12CD34) untuk melihat status pesanan
        dan bukti pembayaran.
      </p>
      <TransaksiLookup />
    </div>
  );
}
