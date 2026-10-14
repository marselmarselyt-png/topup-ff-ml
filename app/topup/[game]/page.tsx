import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TopUpForm } from "./TopUpForm";
import { gameLabel } from "@/lib/format";
import { computeTotals } from "@/lib/pricing";

const GAME_CODES: Record<string, string> = { ff: "FF", ml: "ML" };

export default async function TopUpPage({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game: gameParam } = await params;
  const game = GAME_CODES[gameParam.toLowerCase()];
  if (!game) notFound();

  const products = await prisma.product.findMany({
    where: { game, active: true },
    orderBy: { sortOrder: "asc" },
  });

  const items = products.map((p) => {
    const t = computeTotals(p);
    return {
      id: p.id,
      name: p.name,
      diamonds: p.diamonds,
      price: t.price,
      fee: t.fee,
      total: t.total,
    };
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">
        Top Up {gameLabel(game)}
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Masukkan ID game, pilih nominal, lalu bayar. Kami tidak pernah meminta
        password atau OTP akun Anda.
      </p>
      <TopUpForm game={game as "FF" | "ML"} products={items} />
    </div>
  );
}
