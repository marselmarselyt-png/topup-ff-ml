import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { rateLimit, clientIp } from "@/lib/ratelimit";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const rl = rateLimit(`order-status:${clientIp(req)}`, 60);
  if (!rl.allowed) return jsonError(429, "RATE_LIMITED", "Terlalu banyak permintaan");

  const { code } = await ctx.params;
  const order = await prisma.order.findUnique({
    where: { orderCode: code.toUpperCase() },
    include: {
      payment: { select: { method: true, status: true, paidAt: true } },
      fulfillments: {
        select: { serialNo: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!order) return jsonError(404, "NOT_FOUND", "Transaksi tidak ditemukan");

  const serialNo = order.fulfillments[0]?.serialNo ?? null;
  return NextResponse.json({
    orderCode: order.orderCode,
    game: order.game,
    gameUserId: order.gameUserId,
    gameZoneId: order.gameZoneId,
    productName: order.productName,
    price: order.price,
    fee: order.fee,
    total: order.total,
    status: order.status,
    payment: order.payment
      ? {
          method: order.payment.method,
          status: order.payment.status,
          paidAt: order.payment.paidAt,
        }
      : null,
    serialNo: order.status === "SUCCESS" ? serialNo : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });
}
