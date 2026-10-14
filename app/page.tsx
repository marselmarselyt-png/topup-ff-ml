import Link from "next/link";

const games = [
  {
    code: "ff",
    name: "Free Fire",
    desc: "Top up diamond FF — cukup Player ID, tanpa password.",
    badge: "FF",
    color: "from-orange-500 to-red-600",
  },
  {
    code: "ml",
    name: "Mobile Legends",
    desc: "Top up diamond MLBB — butuh User ID + Zone ID.",
    badge: "ML",
    color: "from-blue-500 to-indigo-600",
  },
];

const features = [
  ["Cepat", "Diamond diproses otomatis begitu pembayaran terverifikasi."],
  ["Aman", "Pembayaran lewat gateway resmi (QRIS). Tanpa password & OTP akun."],
  ["Transparan", "Harga, biaya admin, dan total ditampilkan sebelum checkout."],
  ["Legal", "Distribusi lewat mitra resmi; bukan diamond ilegal atau exploit."],
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="text-center">
        <h1 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
          Top Up Diamond Game, Cepat & Legal
        </h1>
        <p className="mt-3 text-zinc-600">
          Free Fire & Mobile Legends. Bayar via QRIS, diamond masuk otomatis.
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {games.map((g) => (
          <Link
            key={g.code}
            href={`/topup/${g.code}`}
            className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div
              className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${g.color} text-xl font-extrabold text-white`}
            >
              {g.badge}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-zinc-900 group-hover:text-violet-700">
              {g.name}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">{g.desc}</p>
            <p className="mt-3 text-sm font-medium text-violet-700">
              Top up sekarang →
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-4">
        {features.map(([title, desc]) => (
          <div
            key={title}
            className="rounded-xl border border-zinc-200 bg-white p-4"
          >
            <p className="font-semibold text-zinc-900">{title}</p>
            <p className="mt-1 text-sm text-zinc-600">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
