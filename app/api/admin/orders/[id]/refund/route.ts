import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { refundOrder } from "@/lib/orders";
import { toErrorResponse } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const { note } = (await req.json().catch(() => ({}))) as { note?: string };
    await refundOrder(id, `admin:${admin.email}`, note);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
