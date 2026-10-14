# TopUpKu — Platform Top Up Diamond FF & ML

MVP platform top up diamond **Free Fire** dan **Mobile Legends**: transaksi cepat, aman, transparan, dan legal melalui jalur distributor resmi.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4
- **Prisma + SQLite** (mudah diganti Postgres/MySQL)
- **Vitest** untuk unit test
- Auth: session cookie httpOnly + bcrypt
- Arsitektur provider pluggable: payment gateway & distributor ditukar via env

## Menjalankan

```bash
npm install
cp .env.example .env      # sesuaikan
npm run db:push           # buat schema SQLite
npm run db:seed           # admin + katalog produk
npm run dev
```

Buka http://localhost:3000. Login admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` di `.env`.

## Mode Sandbox (default)

- `PAYMENT_PROVIDER=mockpay` — QRIS palsu; tombol **"Simulasikan pembayaran"** di halaman checkout menempuh jalur webhook penuh (signature → parse → proses).
- `DISTRIBUTOR_PROVIDER=mockdist` — fulfillment selalu berhasil dengan SN palsu; set `MOCK_DISTRIBUTOR_FAIL=1` untuk mensimulasikan kegagalan.

## Integrasi provider sungguhan

Tambahkan implementasi baru yang memenuhi interface:

- `lib/payments/types.ts` (`PaymentProvider`) → daftarkan di `lib/payments/index.ts`, set `PAYMENT_PROVIDER` + `PAYMENT_WEBHOOK_SECRET`.
- `lib/distributor/types.ts` (`DistributorProvider`) → daftarkan di `lib/distributor/index.ts`, set `DISTRIBUTOR_PROVIDER`.

Kandidat umum: Digiflazz / VIP Reseller / ApiGames (distributor), Midtrans / Xendit / Tripay (payment).

## Alur transaksi

1. Pilih game → input ID (User+Zone untuk ML, Player ID untuk FF) → opsional cek nickname.
2. Pilih nominal → harga + biaya admin + total tampil sebelum checkout.
3. Bayar via QRIS → gateway mengirim notifikasi ke `POST /api/webhooks/payment` (signature HMAC-SHA256 diverifikasi, `transaction_id` di-dedup).
4. Setelah `PAID`, order diteruskan ke distributor **sekali saja** (klaim atomik `PAID→FULFILLING`).
5. Status: `PENDING_PAYMENT → PAID → FULFILLING → SUCCESS | FAILED → REFUNDED | EXPIRED`.
6. Setiap transisi tercatat di `AuditLog` — semua transaksi dapat ditelusuri.

## Fitur utama

- Katalog produk FF & ML (admin bisa ubah harga/fee/status aktif).
- Idempotensi order (`idempotencyKey`) dan notifikasi pembayaran (`transactionId` unik).
- Halaman status transaksi publik (`/transaksi` + `/checkout/<kode>`).
- Akun pelanggan: register/login, riwayat transaksi.
- Dashboard admin: statistik, daftar pesanan, edit produk, refund, retry fulfillment, audit trail.
- Rate limiting endpoint sensitif; validasi input server-side (zod); tanpa password/OTP akun game.
- Halaman legal: syarat layanan, refund, privasi, kontak.

## Test

```bash
npm test          # vitest: pricing, state machine, idempotensi, webhook
npm run build
npm run lint
```
