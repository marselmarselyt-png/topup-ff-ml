import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { retryFulfillment } from "@/lib/orders";
import { toErrorResponse } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    await retryFulfillment(id, `admin:${admin.email}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
