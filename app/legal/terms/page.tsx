import { env } from "@/lib/env";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">Syarat Layanan</h1>
      <div className="mt-4 space-y-4 text-sm leading-6 text-zinc-700">
        <p>
          {env.businessName} menyediakan layanan top up diamond Free Fire dan
          Mobile Legends melalui jalur distribusi resmi dan berwenang. Dengan
          menggunakan layanan ini Anda menyetujui ketentuan berikut.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Anda wajib memasukkan ID game yang benar ({`Player ID untuk Free
            Fire; User ID dan Zone ID untuk Mobile Legends`}). Kesalahan input
            ID menjadi tanggung jawab pengguna.
          </li>
          <li>
            Harga, biaya admin, dan total pembayaran ditampilkan sebelum
            checkout dan bersifat final pada saat pembayaran dibuat.
          </li>
          <li>
            Pesanan hanya diproses setelah pembayaran terverifikasi melalui
            notifikasi resmi penyedia pembayaran.
          </li>
          <li>
            Kami <b>tidak pernah</b> meminta password, OTP, atau kredensial akun
            game Anda. Jangan berikan data tersebut kepada siapa pun yang
            mengaku dari pihak kami.
          </li>
          <li>
            Kami tidak menjual diamond ilegal, hasil penipuan, atau memakai
            metode eksploitasi. Penggunaan layanan untuk aktivitas yang
            melanggar ketentuan publisher dilarang.
          </li>
          <li>
            {env.businessName} adalah layanan independen dan bukan afiliasi
            resmi Garena maupun Moonton. Nama game dan merek dagang terkait
            adalah milik pemiliknya masing-masing.
          </li>
        </ol>
      </div>
    </div>
  );
}
