import { NextResponse } from "next/server";
import { orderInputSchema } from "@/lib/validators";
import { createOrder } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { jsonError, toErrorResponse } from "@/lib/http";

export async function POST(req: Request) {
  const rl = rateLimit(`orders:${clientIp(req)}`, 15);
  if (!rl.allowed) return jsonError(429, "RATE_LIMITED", "Terlalu banyak permintaan");

  const body = orderInputSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError(400, "VALIDATION", "Input tidak valid");

  try {
    const user = await getCurrentUser();
    const order = await createOrder({
      ...body.data,
      userId: user?.id ?? null,
    });
    return NextResponse.json(
      {
        orderCode: order.orderCode,
        status: order.status,
        total: order.total,
      },
      { status: 201 }
    );
  } catch (e) {
    return toErrorResponse(e);
  }
}
