"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  game: string;
  sku: string;
  name: string;
  price: number;
  basePrice: number;
  feeType: string;
  feeValue: number;
  active: boolean;
};

function rp(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

export function ProductEditor({ products }: { products: Product[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [feeValue, setFeeValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(id: string) {
    setSaving(true);
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: Number(price),
          feeValue: Number(feeValue),
        }),
      });
      setEditing(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Product) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    router.refresh();
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-600">
          <tr>
            <th className="px-3 py-2">Game</th>
            <th className="px-3 py-2">SKU</th>
            <th className="px-3 py-2">Produk</th>
            <th className="px-3 py-2">Modal</th>
            <th className="px-3 py-2">Harga Jual</th>
            <th className="px-3 py-2">Fee</th>
            <th className="px-3 py-2">Aktif</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t border-zinc-100">
              <td className="px-3 py-2">{p.game}</td>
              <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
              <td className="px-3 py-2">{p.name}</td>
              <td className="px-3 py-2">{rp(p.basePrice)}</td>
              <td className="px-3 py-2">
                {editing === p.id ? (
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                    className="w-24 rounded border border-zinc-300 px-2 py-1"
                  />
                ) : (
                  rp(p.price)
                )}
              </td>
              <td className="px-3 py-2">
                {editing === p.id ? (
                  <input
                    value={feeValue}
                    onChange={(e) => setFeeValue(e.target.value.replace(/\D/g, ""))}
                    className="w-20 rounded border border-zinc-300 px-2 py-1"
                  />
                ) : (
                  `${p.feeType === "percent" ? `${p.feeValue}%` : rp(p.feeValue)}`
                )}
              </td>
              <td className="px-3 py-2">
                <button
                  onClick={() => toggleActive(p)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    p.active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-zinc-200 text-zinc-600"
                  }`}
                >
                  {p.active ? "Ya" : "Tidak"}
                </button>
              </td>
              <td className="px-3 py-2 text-right">
                {editing === p.id ? (
                  <button
                    onClick={() => save(p.id)}
                    disabled={saving}
                    className="text-sm font-medium text-violet-700"
                  >
                    Simpan
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditing(p.id);
                      setPrice(String(p.price));
                      setFeeValue(String(p.feeValue));
                    }}
                    className="text-sm text-zinc-600 hover:text-violet-700"
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
