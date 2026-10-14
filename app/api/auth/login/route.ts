import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators";
import { verifyPassword, createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { jsonError, toErrorResponse } from "@/lib/http";

export async function POST(req: Request) {
  const rl = rateLimit(`login:${clientIp(req)}`, 10);
  if (!rl.allowed) return jsonError(429, "RATE_LIMITED", "Terlalu banyak percobaan, coba lagi nanti");

  const body = loginSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError(400, "VALIDATION", "Input tidak valid");
  const { email, password } = body.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Pesan generik: jangan bocorkan email terdaftar atau tidak
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return jsonError(401, "INVALID_CREDENTIALS", "Email atau password salah");
    }
    await createSession(user.id);
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
