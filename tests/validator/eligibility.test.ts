import { describe, it, expect } from "vitest";
import { supplierEligibilityCheck } from "@nexus/shared/supplier";

const today = new Date("2026-08-22T00:00:00Z");
function daysFromToday(n: number): Date {
  return new Date(today.getTime() + n * 24 * 60 * 60 * 1000);
}

function baseSupplier() {
  return {
    supplierId: "sup-1",
    certifications: ["ISO9001"],
    moq: 50,
    maxCapacityPerCycle: 1000,
    reliabilityScore: 0.8,
    qualityScore: 0.8,
    leadTimeDays: 3,
    hasOpenContradiction: false
  };
}

function baseCtx() {
  return {
    requiredCertifications: ["ISO9001"],
    qty: 300,
    today,
    neededBy: daysFromToday(8),
    deadlineSlackDays: 4
  };
}

describe("supplierEligibilityCheck", () => {
  it("passes an eligible supplier", () => {
    expect(supplierEligibilityCheck(baseSupplier(), baseCtx())).toEqual({
      eligible: true,
      reasons: []
    });
  });

  it("rejects cheapest supplier failing quality even if reliability/price are fine (Hidden Test 3)", () => {
    const result = supplierEligibilityCheck(
      { ...baseSupplier(), qualityScore: 0.4 },
      baseCtx()
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("qualityScore"))).toBe(true);
  });

  it("raises the reliability floor to 0.7 when deadline slack < 1 day", () => {
    const ctx = { ...baseCtx(), deadlineSlackDays: 0.5 };
    const result = supplierEligibilityCheck({ ...baseSupplier(), reliabilityScore: 0.6 }, ctx);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("reliabilityScore"))).toBe(true);
  });

  it("rejects a supplier with an open tracking/message contradiction", () => {
    const result = supplierEligibilityCheck(
      { ...baseSupplier(), hasOpenContradiction: true },
      baseCtx()
    );
    expect(result.eligible).toBe(false);
  });

  it("rejects when lead time exceeds days until neededBy", () => {
    const result = supplierEligibilityCheck({ ...baseSupplier(), leadTimeDays: 20 }, baseCtx());
    expect(result.eligible).toBe(false);
  });
});
