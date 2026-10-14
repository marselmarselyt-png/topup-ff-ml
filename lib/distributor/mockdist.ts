import crypto from "node:crypto";
import { env } from "../env";
import type {
  CheckIdResult,
  DistributorProvider,
  TopUpRequest,
  TopUpResult,
} from "./types";

function nicknameFor(userId: string): string {
  const h = crypto.createHash("sha1").update(userId).digest("hex").slice(0, 6);
  return `Player_${h.toUpperCase()}`;
}

/**
 * Distributor sandbox: selalu "berhasil" kecuali MOCK_DISTRIBUTOR_FAIL=1.
 * Mensimulasikan provider resmi tanpa kredensial sungguhan.
 */
export const mockdist: DistributorProvider = {
  name: "mockdist",

  async checkId(game, userId): Promise<CheckIdResult> {
    return { valid: true, nickname: nicknameFor(userId) };
  },

  async topup(_req: TopUpRequest): Promise<TopUpResult> {
    if (env.mockDistributorFail) {
      return {
        ok: false,
        message: "Simulasi kegagalan distributor (MOCK_DISTRIBUTOR_FAIL=1)",
      };
    }
    const refId = `DIST-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
    const serialNo = `SN-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
    return { ok: true, refId, serialNo };
  },
};
