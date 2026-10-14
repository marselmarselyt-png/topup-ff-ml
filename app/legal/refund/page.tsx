import { env } from "@/lib/env";

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">Kebijakan Refund</h1>
      <div className="mt-4 space-y-4 text-sm leading-6 text-zinc-700">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <b>Pembayaran berhasil, diamond tidak masuk:</b> tim kami akan
            memeriksa status pesanan ke distributor. Jika pengiriman terbukti
            gagal, dana dikembalikan penuh atau pesanan dikirim ulang sesuai
            pilihan Anda.
          </li>
          <li>
            <b>Pembayaran gagal/kedaluwarsa:</b> pesanan otomatis dibatalkan dan
            tidak ada pengiriman diamond. Dana yang sudah terpotong namun tidak
            terverifikasi akan diproses sesuai ketentuan penyedia pembayaran.
          </li>
          <li>
            <b>Salah input ID game:</b> jika diamond sudah terkirim ke ID yang
            Anda masukkan, transaksi tidak dapat direfund karena produk digital
            bersifat final. Pastikan ID benar sebelum membayar.
          </li>
          <li>
            <b>Pembayaran ganda (duplikat):</b> kelebihan pembayaran akan
            dikembalikan setelah diverifikasi.
          </li>
          <li>
            Pengajuan refund: hubungi {env.businessEmail} atau WhatsApp{" "}
            {env.businessWa} dengan menyertakan kode transaksi (TRX-…) dan bukti
            pembayaran.
          </li>
          <li>
            Estimasi proses refund: 1-7 hari kerja setelah verifikasi, tergantung
            metode pembayaran.
          </li>
        </ol>
      </div>
    </div>
  );
}
