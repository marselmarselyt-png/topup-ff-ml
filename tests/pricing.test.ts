import { describe, it, expect } from "vitest";
import { computeFee, computeTotals } from "../lib/pricing";
import { validateGameId } from "../lib/validators";

describe("pricing", () => {
  it("biaya flat ditambahkan apa adanya", () => {
    expect(computeFee({ price: 7500, feeType: "flat", feeValue: 1500 })).toBe(
      1500
    );
    expect(computeTotals({ price: 7500, feeType: "flat", feeValue: 1500 })).toEqual(
      { price: 7500, fee: 1500, total: 9000 }
    );
  });

  it("biaya persen dihitung dari harga", () => {
    expect(computeFee({ price: 20000, feeType: "percent", feeValue: 5 })).toBe(
      1000
    );
  });
});

describe("validateGameId", () => {
  it("FF: hanya player id angka 5-12 digit", () => {
    expect(validateGameId("FF", "12345678").ok).toBe(true);
    expect(validateGameId("FF", "1234").ok).toBe(false);
    expect(validateGameId("FF", "abc12345").ok).toBe(false);
  });

  it("ML: wajib zone id valid", () => {
    expect(validateGameId("ML", "12345678").ok).toBe(false);
    expect(validateGameId("ML", "12345678", "1234").ok).toBe(true);
    expect(validateGameId("ML", "12345678", "12").ok).toBe(false);
  });
});
