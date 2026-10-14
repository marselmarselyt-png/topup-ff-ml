import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validators";
import { hashPassword, createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { jsonError, toErrorResponse } from "@/lib/http";

export async function POST(req: Request) {
  const rl = rateLimit(`register:${clientIp(req)}`, 10);
  if (!rl.allowed) return jsonError(429, "RATE_LIMITED", "Terlalu banyak permintaan");

  const body = registerSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return jsonError(400, "VALIDATION", "Nama, email, atau password tidak valid (min. 8 karakter)");
  }
  const { name, email, password } = body.data;

  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return jsonError(409, "EMAIL_TAKEN", "Email sudah terdaftar, silakan masuk");
    }
    const user = await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
    });
    await createSession(user.id);
    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (e) {
    return toErrorResponse(e);
  }
}
