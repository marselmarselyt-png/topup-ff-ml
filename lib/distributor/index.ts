import { env } from "../env";
import { mockdist } from "./mockdist";
import type { DistributorProvider } from "./types";

const providers: Record<string, DistributorProvider> = {
  mockdist,
  // Daftarkan provider resmi di sini, mis. digiflazz, vipreseller.
};

export function getDistributor(): DistributorProvider {
  const p = providers[env.distributorProvider];
  if (!p) {
    throw new Error(
      `DISTRIBUTOR_PROVIDER "${env.distributorProvider}" tidak dikenal`
    );
  }
  return p;
}
