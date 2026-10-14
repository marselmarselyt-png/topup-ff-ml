"use client";

import { useEffect, useState } from "react";

const LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu Pembayaran",
  PAID: "Terbayar — memproses ke distributor…",
  FULFILLING: "Sedang diproses distributor…",
  SUCCESS: "Berhasil! Diamond sudah dikirim.",
  FAILED: "Transaksi gagal.",
  REFUNDED: "Dana sudah direfund.",
  EXPIRED: "Pembayaran kedaluwarsa.",
};

type StatusData = {
  status: string;
  serialNo?: string | null;
  payment?: { status: string; paidAt?: string | null } | null;
};

export function PaymentBox({
  orderCode,
  initialStatus,
  mockPayment,
  externalId,
}: {
  orderCode: string;
  initialStatus: string;
  mockPayment: boolean;
  externalId: string | null;
}) {
  const [data, setData] = useState<StatusData>({ status: initialStatus });
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    let stop = false;
    async function poll() {
      try {
        const res = await fetch(`/api/orders/${orderCode}`);
        if (res.ok) {
          const d = await res.json();
          if (!stop) setData(d);
        }
      } catch {
        // abaikan, coba lagi di interval berikutnya
      }
    }
    const t = setInterval(poll, 3000);
    poll();
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [orderCode]);

  async function simulate(status: "PAID" | "FAILED") {
    if (!externalId) return;
    setSimulating(true);
    try {
      await fetch(`/api/payments/${externalId}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const res = await fetch(`/api/orders/${orderCode}`);
      if (res.ok) setData(await res.json());
    } finally {
      setSimulating(false);
    }
  }

  const s = data.status;
  return (
    <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center">
      <p
        className={`font-semibold ${
          s === "SUCCESS"
            ? "text-emerald-700"
            : s === "FAILED" || s === "EXPIRED"
              ? "text-red-700"
              : "text-amber-700"
        }`}
      >
        {LABELS[s] ?? s}
      </p>

      {s === "SUCCESS" && data.serialNo && (
        <p className="mt-2 text-sm text-zinc-700">
          Bukti pengiriman (SN):{" "}
          <span className="font-mono font-semibold">{data.serialNo}</span>
        </p>
      )}

      {(s === "FAILED" || s === "EXPIRED") && (
        <p className="mt-2 text-sm text-zinc-600">
          Butuh bantuan? Hubungi <a href="/kontak" className="text-violet-700 underline">customer support</a>{" "}
          dengan menyebutkan kode transaksi.
        </p>
      )}

      {mockPayment && s === "PENDING_PAYMENT" && (
        <div className="mt-4 rounded-lg border border-dashed border-amber-400 bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-800">
            Mode sandbox: QR di atas tidak terhubung ke uang sungguhan.
          </p>
          <div className="mt-2 flex justify-center gap-2">
            <button
              onClick={() => simulate("PAID")}
              disabled={simulating}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Simulasikan pembayaran berhasil
            </button>
            <button
              onClick={() => simulate("FAILED")}
              disabled={simulating}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Simulasikan gagal
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-zinc-400">
        Status diperbarui otomatis setiap beberapa detik.
      </p>
    </div>
  );
}
