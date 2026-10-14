export interface Priceable {
  price: number;
  feeType: string; // "flat" | "percent"
  feeValue: number;
}

/** Biaya admin: flat (rupiah) atau percent (persen dari harga). */
export function computeFee({ price, feeType, feeValue }: Priceable): number {
  if (feeType === "percent") return Math.round((price * feeValue) / 100);
  return feeValue;
}

export function computeTotals(p: Priceable): {
  price: number;
  fee: number;
  total: number;
} {
  const fee = computeFee(p);
  return { price: p.price, fee, total: p.price + fee };
}
