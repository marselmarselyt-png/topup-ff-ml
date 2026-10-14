import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { env } from "@/lib/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${env.businessName} — Top Up Diamond FF & ML`,
  description:
    "Top up diamond Free Fire dan Mobile Legends: cepat, aman, transparan, dan legal lewat distributor resmi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-violet-700">
              {env.businessName}
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-zinc-700 hover:text-violet-700">
                Top Up
              </Link>
              <Link
                href="/transaksi"
                className="text-zinc-700 hover:text-violet-700"
              >
                Cek Transaksi
              </Link>
              <Link
                href="/akun"
                className="rounded-lg bg-violet-700 px-3 py-1.5 text-white hover:bg-violet-800"
              >
                Akun
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-zinc-200 bg-white text-sm text-zinc-600">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:grid-cols-3">
            <div>
              <p className="font-semibold text-zinc-900">{env.businessName}</p>
              <p className="mt-1">
                Top up diamond resmi & legal. Kami tidak meminta password atau
                OTP akun game Anda.
              </p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Legal</p>
              <ul className="mt-1 space-y-1">
                <li>
                  <Link href="/legal/terms" className="hover:text-violet-700">
                    Syarat Layanan
                  </Link>
                </li>
                <li>
                  <Link href="/legal/refund" className="hover:text-violet-700">
                    Kebijakan Refund
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacy" className="hover:text-violet-700">
                    Kebijakan Privasi
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Bantuan</p>
              <ul className="mt-1 space-y-1">
                <li>
                  <Link href="/kontak" className="hover:text-violet-700">
                    Hubungi Kami
                  </Link>
                </li>
                <li>{env.businessEmail}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-100 px-4 py-3 text-center text-xs text-zinc-500">
            {env.businessName} adalah layanan top up independen dan bukan
            afiliasi resmi Garena maupun Moonton.
          </div>
        </footer>
      </body>
    </html>
  );
}
