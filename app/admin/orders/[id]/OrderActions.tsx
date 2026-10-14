"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const canRefund = ["PAID", "FAILED", "SUCCESS"].includes(status);
  const canRetry = status === "FAILED";
  if (!canRefund && !canRetry) return null;

  async function call(path: string, body?: object) {
    setBusy(true);
    try {
      await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-zinc-200 pt-4">
      <p className="text-sm font-semibold text-zinc-900">Aksi Admin</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {canRetry && (
          <button
            onClick={() => call(`/api/admin/orders/${orderId}/retry`)}
            disabled={busy}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Kirim ulang ke distributor
          </button>
        )}
        {canRefund && (
          <>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan refund (opsional)"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
            <button
              onClick={() =>
                call(`/api/admin/orders/${orderId}/refund`, { note })
              }
              disabled={busy}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Refund
            </button>
          </>
        )}
      </div>
    </div>
  );
}
