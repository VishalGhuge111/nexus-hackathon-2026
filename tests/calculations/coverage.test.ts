import { describe, it, expect } from "vitest";
import { coverageDays, hasStockDiscrepancy, safetyStockRisk } from "@nexus/shared/calculations";

describe("coverageDays", () => {
  it("computes usableStock / dailyUsageRate", () => {
    // PRD §19 example: currentStock=800 (ERP), usableStock=390, usage=90/day -> 4.3
    const result = coverageDays({ usableStock: 390, dailyUsageRate: 90 });
    expect(result.coverageDays).toBeCloseTo(4.333, 2);
    expect(result.dataIntegrityFlag).toBe(false);
  });

  it("returns Infinity when dailyUsageRate is 0", () => {
    expect(coverageDays({ usableStock: 100, dailyUsageRate: 0 }).coverageDays).toBe(Infinity);
  });

  it("clamps negative usableStock to 0 and flags data integrity", () => {
    const result = coverageDays({ usableStock: -10, dailyUsageRate: 5 });
    expect(result.coverageDays).toBe(0);
    expect(result.dataIntegrityFlag).toBe(true);
  });
});

describe("hasStockDiscrepancy", () => {
  it("flags any nonzero difference between currentStock and usableStock", () => {
    expect(hasStockDiscrepancy(800, 390)).toBe(true);
    expect(hasStockDiscrepancy(390, 390)).toBe(false);
  });
});

describe("safetyStockRisk", () => {
  it("breaches when ratio < 1.0", () => {
    // PRD §19 example: usableStock=300, threshold=500 -> ratio=0.6 -> breach
    const result = safetyStockRisk({ usableStock: 300, safetyStockThreshold: 500 });
    expect(result.ratio).toBeCloseTo(0.6, 5);
    expect(result.breach).toBe(true);
  });

  it("disables the indicator when threshold is 0 instead of crashing", () => {
    const result = safetyStockRisk({ usableStock: 100, safetyStockThreshold: 0 });
    expect(result.disabled).toBe(true);
    expect(result.breach).toBe(false);
  });
});
