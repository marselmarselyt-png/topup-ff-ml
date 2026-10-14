import { z } from "zod";

export const GAMES = ["FF", "ML"] as const;
export type Game = (typeof GAMES)[number];

export function needsZoneId(game: string): boolean {
  return game === "ML";
}

/** Aturan format ID game. Kami TIDAK PERNAH meminta password atau OTP akun. */
export function validateGameId(
  game: string,
  userId: string,
  zoneId?: string | null
): { ok: boolean; error?: string } {
  if (!/^\d{5,12}$/.test(userId)) {
    return {
      ok: false,
      error:
        game === "FF"
          ? "Player ID harus berupa 5-12 digit angka"
          : "User ID harus berupa 5-12 digit angka",
    };
  }
  if (needsZoneId(game)) {
    if (!zoneId || !/^\d{3,10}$/.test(zoneId)) {
      return { ok: false, error: "Zone ID harus berupa 3-10 digit angka" };
    }
  }
  return { ok: true };
}

export const orderInputSchema = z.object({
  productId: z.string().min(1),
  gameUserId: z.string().min(1).max(32),
  gameZoneId: z.string().max(32).nullish(),
  idempotencyKey: z.string().min(8).max(128),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export const paymentCallbackSchema = z.object({
  transaction_id: z.string().min(1),
  external_id: z.string().min(1),
  status: z.enum(["PAID", "FAILED", "EXPIRED"]),
  amount: z.number().int().positive(),
});
