export interface CheckIdResult {
  valid: boolean;
  nickname?: string;
  error?: string;
}

export interface TopUpRequest {
  sku: string;
  gameUserId: string;
  gameZoneId?: string | null;
}

export interface TopUpResult {
  ok: boolean;
  refId?: string;
  serialNo?: string;
  message?: string;
}

/**
 * Kontrak provider distributor resmi (Digiflazz, VIP Reseller, dsb).
 * Implementasi baru cukup memenuhi interface ini lalu didaftarkan di index.ts.
 */
export interface DistributorProvider {
  name: string;
  /** Validasi ID game ke layanan cek-nickname distributor, bila tersedia. */
  checkId(
    game: string,
    userId: string,
    zoneId?: string | null
  ): Promise<CheckIdResult>;
  /** Teruskan pesanan ke distributor. Harus idempotent di sisi provider. */
  topup(req: TopUpRequest): Promise<TopUpResult>;
}
