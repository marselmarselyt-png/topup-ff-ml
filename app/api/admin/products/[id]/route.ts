import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { jsonError, toErrorResponse } from "@/lib/http";

const patchSchema = z.object({
  price: z.number().int().positive().optional(),
  basePrice: z.number().int().nonnegative().optional(),
  feeType: z.enum(["flat", "percent"]).optional(),
  feeValue: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
  name: z.string().min(1).max(120).optional(),
  sortOrder: z.number().int().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = patchSchema.safeParse(await req.json().catch(() => null));
    if (!body.success) return jsonError(400, "VALIDATION", "Input tidak valid");

    const product = await prisma.product.update({
      where: { id },
      data: body.data,
    });
    await prisma.auditLog.create({
      data: {
        actor: `admin:${admin.email}`,
        action: "product:updated",
        detail: `${product.sku} ${JSON.stringify(body.data)}`,
      },
    });
    return NextResponse.json(product);
  } catch (e) {
    return toErrorResponse(e);
  }
}
