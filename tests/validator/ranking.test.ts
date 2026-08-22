import { describe, it, expect } from "vitest";
import { rankRecoveryPlans, scoreRfqCandidate } from "@nexus/shared/supplier";

describe("rankRecoveryPlans", () => {
  it("prefers a plan that avoids deadline breach over one that doesn't, regardless of cost", () => {
    const ranked = rankRecoveryPlans([
      { planVersionId: "cheap-but-late", deadlineBreached: true, incrementalCost: 100, supplierCount: 1, avgReliabilityAndQuality: 0.9 },
      { planVersionId: "on-time", deadlineBreached: false, incrementalCost: 5000, supplierCount: 1, avgReliabilityAndQuality: 0.8 }
    ]);
    expect(ranked[0].planVersionId).toBe("on-time");
  });

  it("tie-breaks by lowest incremental cost, then fewest suppliers, then highest avg reliability/quality", () => {
    const ranked = rankRecoveryPlans([
      { planVersionId: "expensive", deadlineBreached: false, incrementalCost: 2000, supplierCount: 1, avgReliabilityAndQuality: 0.9 },
      { planVersionId: "cheap", deadlineBreached: false, incrementalCost: 1000, supplierCount: 2, avgReliabilityAndQuality: 0.7 }
    ]);
    expect(ranked[0].planVersionId).toBe("cheap");
  });
});

describe("scoreRfqCandidate", () => {
  it("scores a cheaper, more reliable, faster candidate higher than a pricier slower one", () => {
    const good = scoreRfqCandidate(
      { supplierId: "a", price: 100, leadTimeDays: 2, reliabilityScore: 0.9, qualityScore: 0.9, capacityOffered: 500, requestedQty: 400 },
      100,
      200,
      2,
      10
    );
    const worse = scoreRfqCandidate(
      { supplierId: "b", price: 200, leadTimeDays: 10, reliabilityScore: 0.5, qualityScore: 0.5, capacityOffered: 500, requestedQty: 400 },
      100,
      200,
      2,
      10
    );
    expect(good).toBeGreaterThan(worse);
  });
});
