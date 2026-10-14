"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TransaksiLookup() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup() {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${c}`);
      if (res.status === 404) {
        setError("Transaksi tidak ditemukan. Periksa kembali kode Anda.");
        return;
      }
      if (!res.ok) {
        setError("Gagal memeriksa transaksi, coba lagi.");
        return;
      }
      router.push(`/checkout/${c}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup()}
          placeholder="TRX-XXXXXXXX"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm uppercase focus:border-violet-500 focus:outline-none"
        />
        <button
          onClick={lookup}
          disabled={loading || !code.trim()}
          className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? "…" : "Cek"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-3 text-xs text-zinc-500">
        Sudah punya akun? <a href="/akun" className="text-violet-700 underline">Masuk</a>{" "}
        untuk melihat seluruh riwayat transaksi Anda.
      </p>
    </div>
  );
}
