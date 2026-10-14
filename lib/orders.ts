import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { computeTotals } from "./pricing";
import { validateGameId } from "./validators";
import { getPaymentProvider } from "./payments";
import { getDistributor } from "./distributor";

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "FULFILLING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
  "EXPIRED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Transisi status yang legal — state machine order. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "FAILED", "EXPIRED"],
  PAID: ["FULFILLING", "REFUNDED"],
  FULFILLING: ["SUCCESS", "FAILED"],
  FAILED: ["FULFILLING", "REFUNDED"], // retry distributor atau refund
  SUCCESS: ["REFUNDED"],
  REFUNDED: [],
  EXPIRED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

type Tx = Prisma.TransactionClient;

async function audit(
  tx: Tx,
  orderId: string,
  actor: string,
  action: string,
  detail?: string
) {
  await tx.auditLog.create({
    data: { orderId, actor, action, detail },
  });
}

/**
 * Pindah status order dengan validasi state machine + audit log.
 * Harus dipanggil di dalam transaksi.
 */
export async function transitionOrder(
  tx: Tx,
  orderId: string,
  to: OrderStatus,
  actor: string,
  detail?: string
): Promise<void> {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
  const from = order.status as OrderStatus;
  if (from === to) return;
  if (!canTransition(from, to)) {
    throw new Error(`Transisi status ilegal: ${from} -> ${to}`);
  }
  await tx.order.update({ where: { id: orderId }, data: { status: to } });
  await audit(tx, orderId, actor, `status:${from}->${to}`, detail);
}

function orderCode(): string {
  return `TRX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export interface CreateOrderInput {
  productId: string;
  gameUserId: string;
  gameZoneId?: string | null;
  idempotencyKey: string;
  userId?: string | null;
}

export class OrderError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Buat order + tagihan pembayaran. Idempotent via idempotencyKey:
 * retry/duplikat mengembalikan order yang sama, tidak membuat order baru.
 */
export async function createOrder(input: CreateOrderInput) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });
  if (!product || !product.active) {
    throw new OrderError("PRODUCT_NOT_FOUND", "Produk tidak tersedia");
  }

  const check = validateGameId(
    product.game,
    input.gameUserId,
    input.gameZoneId
  );
  if (!check.ok) {
    throw new OrderError("INVALID_GAME_ID", check.error!);
  }

  const totals = computeTotals(product);
  const provider = getPaymentProvider();

  const code = orderCode();
  try {
    return await prisma.$transaction(async (tx) => {
      const payment = await provider.createPayment({
        orderCode: code,
        amount: totals.total,
      });
      const order = await tx.order.create({
        data: {
          orderCode: code,
          userId: input.userId ?? null,
          game: product.game,
          gameUserId: input.gameUserId,
          gameZoneId: input.gameZoneId ?? null,
          productId: product.id,
          productName: product.name,
          price: totals.price,
          fee: totals.fee,
          total: totals.total,
          status: "PENDING_PAYMENT",
          idempotencyKey: input.idempotencyKey,
          payment: {
            create: {
              provider: provider.name,
              method: payment.method,
              externalId: payment.externalId,
              amount: totals.total,
              qrPayload: payment.qrPayload,
              status: "PENDING",
            },
          },
        },
        include: { payment: true },
      });
      await audit(tx, order.id, "system", "order:created", order.orderCode);
      return order;
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      // idempotencyKey bentrok → order sudah dibuat sebelumnya
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { payment: true },
      });
      if (existing) return existing;
    }
    throw e;
  }
}

export type HandleNotificationResult =
  | { kind: "paid"; orderId: string }
  | { kind: "duplicate" }
  | { kind: "terminal"; orderId: string; status: OrderStatus }
  | { kind: "not_found" }
  | { kind: "amount_mismatch"; orderId: string };

/**
 * Proses notifikasi pembayaran yang SUDAH terverifikasi signature-nya.
 * Anti-duplikat: transactionId unik + status payment yang bukan PENDING
 * membuat notifikasi berulang menjadi no-op.
 */
export async function handlePaymentNotification(n: {
  transactionId: string;
  externalId: string;
  status: "PAID" | "FAILED" | "EXPIRED";
  amount: number;
  rawBody: string;
}): Promise<HandleNotificationResult> {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { externalId: n.externalId },
      include: { order: true },
    });
    if (!payment) return { kind: "not_found" } as const;

    // Dedup: notifikasi berulang dengan transactionId sama → no-op
    if (payment.transactionId === n.transactionId) {
      return { kind: "duplicate" } as const;
    }
    // Sudah diproses dengan transactionId lain (tidak seharusnya terjadi)
    if (payment.status !== "PENDING") {
      return { kind: "duplicate" } as const;
    }

    const order = payment.order;
    const orderStatus = order.status as OrderStatus;

    if (n.status === "PAID") {
      if (n.amount !== payment.amount) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { rawCallback: n.rawBody },
        });
        await audit(
          tx,
          order.id,
          "webhook",
          "payment:amount_mismatch",
          `expected=${payment.amount} got=${n.amount}`
        );
        return { kind: "amount_mismatch", orderId: order.id } as const;
      }
      // Hanya proses jika order masih menunggu pembayaran (atomik di sini)
      if (orderStatus !== "PENDING_PAYMENT") {
        return { kind: "duplicate" } as const;
      }
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: n.transactionId,
          status: "PAID",
          paidAt: new Date(),
          rawCallback: n.rawBody,
        },
      });
      await transitionOrder(tx, order.id, "PAID", "webhook", n.transactionId);
      return { kind: "paid", orderId: order.id } as const;
    }

    // FAILED / EXPIRED
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: n.transactionId,
        status: n.status,
        rawCallback: n.rawBody,
      },
    });
    if (orderStatus === "PENDING_PAYMENT") {
      await transitionOrder(tx, order.id, n.status, "webhook", n.transactionId);
    }
    return { kind: "terminal", orderId: order.id, status: n.status } as const;
  });

  // Fulfillment hanya oleh pemroses notifikasi yang menang transisi PENDING→PAID
  if (result.kind === "paid") {
    await fulfillOrder(result.orderId);
  }
  return result;
}

/**
 * Teruskan order ke distributor. Idempotent: hanya berjalan untuk order
 * berstatus PAID (retry lewat admin memakai retryFulfillment).
 */
export async function fulfillOrder(orderId: string): Promise<void> {
  // Klaim transisi PAID -> FULFILLING secara atomik; pemenang yang fulfill.
  const claimed = await prisma.$transaction(async (tx) => {
    const count = await tx.order.updateMany({
      where: { id: orderId, status: "PAID" },
      data: { status: "FULFILLING" },
    });
    if (count.count === 1) {
      await audit(tx, orderId, "system", "status:PAID->FULFILLING");
      return true;
    }
    return false;
  });
  if (!claimed) return;

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { product: true },
  });
  const distributor = getDistributor();

  const fulfillment = await prisma.fulfillment.create({
    data: { orderId, provider: distributor.name, status: "REQUESTED" },
  });

  try {
    const res = await distributor.topup({
      sku: order.product.sku,
      gameUserId: order.gameUserId,
      gameZoneId: order.gameZoneId,
    });
    await prisma.$transaction(async (tx) => {
      await tx.fulfillment.update({
        where: { id: fulfillment.id },
        data: {
          status: res.ok ? "SUCCESS" : "FAILED",
          refId: res.refId,
          serialNo: res.serialNo,
          message: res.message,
        },
      });
      await transitionOrder(
        tx,
        orderId,
        res.ok ? "SUCCESS" : "FAILED",
        "distributor",
        res.ok ? `SN=${res.serialNo}` : res.message
      );
    });
  } catch (e) {
    await prisma.$transaction(async (tx) => {
      await tx.fulfillment.update({
        where: { id: fulfillment.id },
        data: {
          status: "FAILED",
          message: e instanceof Error ? e.message : "error",
        },
      });
      await transitionOrder(
        tx,
        orderId,
        "FAILED",
        "distributor",
        e instanceof Error ? e.message : "distributor error"
      );
    });
  }
}

/** Retry fulfillment untuk order FAILED (aksi admin). */
export async function retryFulfillment(orderId: string, actor: string) {
  await prisma.$transaction(async (tx) => {
    await audit(tx, orderId, actor, "fulfillment:retry");
    await transitionOrder(tx, orderId, "FULFILLING", actor);
  });
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { product: true },
  });
  const distributor = getDistributor();
  const fulfillment = await prisma.fulfillment.create({
    data: { orderId, provider: distributor.name, status: "REQUESTED" },
  });
  const res = await distributor.topup({
    sku: order.product.sku,
    gameUserId: order.gameUserId,
    gameZoneId: order.gameZoneId,
  });
  await prisma.$transaction(async (tx) => {
    await tx.fulfillment.update({
      where: { id: fulfillment.id },
      data: {
        status: res.ok ? "SUCCESS" : "FAILED",
        refId: res.refId,
        serialNo: res.serialNo,
        message: res.message,
      },
    });
    await transitionOrder(
      tx,
      orderId,
      res.ok ? "SUCCESS" : "FAILED",
      "distributor",
      res.ok ? `SN=${res.serialNo}` : res.message
    );
  });
}

/** Refund manual oleh admin untuk order PAID/FAILED/SUCCESS. */
export async function refundOrder(
  orderId: string,
  actor: string,
  note?: string
) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { orderId } });
    if (payment && payment.status === "PAID") {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
    }
    await transitionOrder(tx, orderId, "REFUNDED", actor, note);
    await audit(tx, orderId, actor, "refund:issued", note);
  });
}
