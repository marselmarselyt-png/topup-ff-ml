"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForms() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register" ? { name, email, password } : { email, password }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Gagal, coba lagi");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none";

  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex rounded-lg bg-zinc-100 p-1 text-sm font-medium">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md py-1.5 ${
              mode === m ? "bg-white shadow-sm" : "text-zinc-500"
            }`}
          >
            {m === "login" ? "Masuk" : "Daftar"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {mode === "register" && (
          <label className="block">
            <span className="text-sm text-zinc-600">Nama</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={input}
              placeholder="Nama Anda"
            />
          </label>
        )}
        <label className="block">
          <span className="text-sm text-zinc-600">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
            placeholder="email@contoh.com"
          />
        </label>
        <label className="block">
          <span className="text-sm text-zinc-600">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
            placeholder={mode === "register" ? "Min. 8 karakter" : "Password"}
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={
          loading || !email || !password || (mode === "register" && !name)
        }
        className="mt-4 w-full rounded-xl bg-violet-700 py-2.5 font-semibold text-white disabled:opacity-40"
      >
        {loading ? "…" : mode === "login" ? "Masuk" : "Daftar"}
      </button>
    </div>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.refresh();
      }}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
    >
      Keluar
    </button>
  );
}
