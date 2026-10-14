"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  diamonds: number;
  price: number;
  fee: number;
  total: number;
};

function rp(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

export function TopUpForm({
  game,
  products,
}: {
  game: "FF" | "ML";
  products: Product[];
}) {
  const router = useRouter();
  const needsZone = game === "ML";
  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [nickname, setNickname] = useState<string | null>(null);
  const [checkMsg, setCheckMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Kunci idempoten dibuat sekali per sesi form — retry tidak membuat order ganda.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const selected = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId]
  );

  async function checkId() {
    setChecking(true);
    setCheckMsg(null);
    setNickname(null);
    try {
      const res = await fetch("/api/validate-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, userId, zoneId: needsZone ? zoneId : null }),
      });
      const data = await res.json();
      if (data.valid) {
        setNickname(data.nickname ?? "ID valid");
      } else {
        setCheckMsg(data.error ?? "ID tidak valid");
      }
    } catch {
      setCheckMsg("Gagal memeriksa ID, coba lagi");
    } finally {
      setChecking(false);
    }
  }

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selected.id,
          gameUserId: userId,
          gameZoneId: needsZone ? zoneId : null,
          idempotencyKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Gagal membuat pesanan");
        return;
      }
      router.push(`/checkout/${data.orderCode}`);
    } catch {
      setError("Gagal membuat pesanan, coba lagi");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    !!selected && /^\d{5,12}$/.test(userId) && (!needsZone || /^\d{3,10}$/.test(zoneId));

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">1. Masukkan ID Game</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-zinc-600">
              {game === "FF" ? "Player ID" : "User ID"}
            </span>
            <input
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value.replace(/\D/g, ""));
                setNickname(null);
              }}
              inputMode="numeric"
              placeholder="Contoh: 12345678"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            />
          </label>
          {needsZone && (
            <label className="block">
              <span className="text-sm text-zinc-600">Zone ID</span>
              <input
                value={zoneId}
                onChange={(e) => {
                  setZoneId(e.target.value.replace(/\D/g, ""));
                  setNickname(null);
                }}
                inputMode="numeric"
                placeholder="Contoh: 12345"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
            </label>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={checkId}
            disabled={checking || !/^\d{5,12}$/.test(userId) || (needsZone && !/^\d{3,10}$/.test(zoneId))}
            className="rounded-lg border border-violet-700 px-3 py-1.5 text-sm font-medium text-violet-700 disabled:opacity-40"
          >
            {checking ? "Memeriksa…" : "Cek ID"}
          </button>
          {nickname && (
            <span className="text-sm text-emerald-700">✓ {nickname}</span>
          )}
          {checkMsg && <span className="text-sm text-red-600">{checkMsg}</span>}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">2. Pilih Nominal Diamond</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => setProductId(p.id)}
              className={`rounded-xl border p-3 text-left transition ${
                productId === p.id
                  ? "border-violet-600 bg-violet-50"
                  : "border-zinc-200 hover:border-violet-300"
              }`}
            >
              <p className="font-semibold text-zinc-900">{p.name}</p>
              <p className="mt-1 text-sm text-zinc-600">{rp(p.price)}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">3. Pembayaran</h2>
        <div className="mt-3 rounded-xl border border-violet-600 bg-violet-50 p-3">
          <p className="font-semibold text-zinc-900">QRIS</p>
          <p className="text-sm text-zinc-600">
            Scan dengan e-wallet / mobile banking apa pun.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">Ringkasan</h2>
        {selected ? (
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-600">{selected.name}</dt>
              <dd>{rp(selected.price)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-600">Biaya admin</dt>
              <dd>{rp(selected.fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{rp(selected.total)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Pilih nominal dulu.</p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          onClick={submit}
          disabled={!canSubmit || submitting}
          className="mt-4 w-full rounded-xl bg-violet-700 py-3 font-semibold text-white hover:bg-violet-800 disabled:opacity-40"
        >
          {submitting ? "Memproses…" : "Bayar Sekarang"}
        </button>
      </section>
    </div>
  );
}
