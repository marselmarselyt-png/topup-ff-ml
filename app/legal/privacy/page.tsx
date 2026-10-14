import { env } from "@/lib/env";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">Kebijakan Privasi</h1>
      <div className="mt-4 space-y-4 text-sm leading-6 text-zinc-700">
        <p>
          {env.businessName} memproses data pelanggan secara aman dan hanya untuk
          kebutuhan transaksi.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <b>Data yang kami kumpulkan:</b> ID game, alamat email, nama, serta
            data transaksi (nominal, harga, status, bukti pembayaran).
          </li>
          <li>
            <b>Data yang TIDAK kami minta:</b> password, OTP, PIN, atau
            kredensial akun game dalam bentuk apa pun.
          </li>
          <li>
            <b>Penggunaan data:</b> memproses pesanan, mengirim bukti transaksi,
            menangani refund/eskalasi, serta kepatuhan hukum dan audit.
          </li>
          <li>
            <b>Berbagi data:</b> data ID game diteruskan ke distributor resmi
            hanya untuk pengiriman diamond; data pembayaran diproses oleh
            penyedia pembayaran resmi. Kami tidak menjual data pelanggan.
          </li>
          <li>
            <b>Penyimpanan:</b> data transaksi disimpan untuk keperluan audit
            dan penanganan sengketa sesuai hukum yang berlaku.
          </li>
          <li>
            Pertanyaan privasi: {env.businessEmail}.
          </li>
        </ol>
      </div>
    </div>
  );
}
