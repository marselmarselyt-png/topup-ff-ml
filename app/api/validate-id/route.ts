import { NextResponse } from "next/server";
import { z } from "zod";
import { validateGameId, needsZoneId } from "@/lib/validators";
import { getDistributor } from "@/lib/distributor";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { jsonError } from "@/lib/http";

const bodySchema = z.object({
  game: z.enum(["FF", "ML"]),
  userId: z.string().min(1).max(32),
  zoneId: z.string().max(32).nullish(),
});

export async function POST(req: Request) {
  const rl = rateLimit(`validate-id:${clientIp(req)}`, 20);
  if (!rl.allowed) return jsonError(429, "RATE_LIMITED", "Terlalu banyak permintaan");

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError(400, "VALIDATION", "Input tidak valid");
  const { game, userId, zoneId } = body.data;

  const format = validateGameId(game, userId, zoneId);
  if (!format.ok) {
    return NextResponse.json({ valid: false, error: format.error });
  }

  try {
    const result = await getDistributor().checkId(
      game,
      userId,
      needsZoneId(game) ? zoneId : null
    );
    return NextResponse.json(result);
  } catch {
    // Layanan validasi distributor tidak tersedia: format sudah valid,
    // order tetap boleh lanjut sesuai spesifikasi.
    return NextResponse.json({ valid: true, nickname: null });
  }
}
