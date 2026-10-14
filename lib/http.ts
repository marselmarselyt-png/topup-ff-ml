import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { OrderError } from "./orders";

export function jsonError(
  status: number,
  code: string,
  message: string
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Ubah exception domain menjadi respons HTTP yang konsisten. */
export function toErrorResponse(e: unknown): NextResponse {
  if (e instanceof AuthError) {
    return jsonError(e.code === "FORBIDDEN" ? 403 : 401, e.code, e.message);
  }
  if (e instanceof OrderError) {
    const status =
      e.code === "PRODUCT_NOT_FOUND" ? 404 : e.code === "INVALID_GAME_ID" ? 400 : 400;
    return jsonError(status, e.code, e.message);
  }
  if (e instanceof Error && e.name === "ZodError") {
    return jsonError(400, "VALIDATION", "Input tidak valid");
  }
  console.error(e);
  return jsonError(500, "INTERNAL", "Terjadi kesalahan server");
}
