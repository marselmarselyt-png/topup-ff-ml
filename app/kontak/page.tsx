import { env } from "@/lib/env";

export default function KontakPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">Hubungi Kami</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Butuh bantuan untuk transaksi gagal, diamond belum masuk, atau refund?
        Sertakan kode transaksi (TRX-…) agar cepat ditangani.
      </p>
      <div className="mt-6 space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Bisnis</span>
          <span className="font-medium">{env.businessName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Email</span>
          <a
            href={`mailto:${env.businessEmail}`}
            className="font-medium text-violet-700"
          >
            {env.businessEmail}
          </a>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">WhatsApp</span>
          <a
            href={`https://wa.me/${env.businessWa}`}
            className="font-medium text-violet-700"
          >
            +{env.businessWa}
          </a>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Jam layanan</span>
          <span className="font-medium">08.00–22.00 WIB</span>
        </div>
      </div>
      <p className="mt-4 text-xs text-zinc-500">
        Customer support tidak akan pernah meminta password atau OTP akun game
        Anda.
      </p>
    </div>
  );
}
