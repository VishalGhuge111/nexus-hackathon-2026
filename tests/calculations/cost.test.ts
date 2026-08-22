import { describe, it, expect } from "vitest";
import { recoveryCost, incrementalCost } from "@nexus/shared/calculations";

describe("recoveryCost", () => {
  it("sums unitPrice*qty + expedite + shipping across allocations", () => {
    // PRD §19 example: 400 units @ 250 + 5000 expedite = 105000
    const cost = recoveryCost([{ unitPrice: 250, qty: 400, expediteFeeIfAny: 5000 }]);
    expect(cost).toBe(105000);
  });

  it("sums across multiple allocations (split order)", () => {
    const cost = recoveryCost([
      { unitPrice: 250, qty: 200 },
      { unitPrice: 300, qty: 200, shippingCost: 1000 }
    ]);
    expect(cost).toBe(250 * 200 + 300 * 200 + 1000);
  });
});

describe("incrementalCost", () => {
  it("allows negative incremental cost (recovery cheaper than baseline)", () => {
    // PRD §19 example: baseline 90000, recovery 105000 -> incremental 15000
    expect(incrementalCost(105000, 90000)).toBe(15000);
    expect(incrementalCost(80000, 90000)).toBe(-10000);
  });
});
