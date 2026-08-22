import { describe, it, expect } from "vitest";
import { validateRecoveryPlan } from "@nexus/shared/validator";
import type { ValidatorContext, ValidatorPlanInput } from "@nexus/shared/validator";

const today = new Date("2026-08-22T00:00:00Z");
function daysFromToday(n: number): Date {
  return new Date(today.getTime() + n * 24 * 60 * 60 * 1000);
}

function baseContext(overrides: Partial<ValidatorContext> = {}): ValidatorContext {
  return {
    today,
    usableStock: 390,
    dailyUsageRate: 90,
    safetyStockThreshold: 150,
    productionRequirement: 700,
    deadlineDate: daysFromToday(8),
    emergencyBudgetRemaining: 500000,
    approvalThreshold: 150000,
    requiredCertifications: ["ISO9001"],
    suppliers: {
      "sup-1": {
        supplierId: "sup-1",
        certifications: ["ISO9001"],
        moq: 50,
        maxCapacityPerCycle: 1000,
        reliabilityScore: 0.9,
        qualityScore: 0.9
      }
    },
    currentCycle: 3,
    inventoryReadCycle: 3,
    eligibilityCheckedCycle: { "sup-1": 3 },
    ...overrides
  };
}

function basePlan(overrides: Partial<ValidatorPlanInput> = {}): ValidatorPlanInput {
  return {
    planVersionId: "v1",
    caseId: "case-1",
    totalCost: 100000,
    requiredQty: 600,
    allocations: [
      {
        supplierId: "sup-1",
        qty: 600,
        unitPrice: 166.67,
        expectedArrivalDate: daysFromToday(2)
      }
    ],
    ...overrides
  };
}

describe("validateRecoveryPlan", () => {
  it("passes a valid single-supplier plan within threshold", () => {
    const result = validateRecoveryPlan(basePlan(), baseContext());
    expect(result.overallPassed).toBe(true);
    expect(result.withinApprovalThreshold).toBe(true);
    expect(result.checks).toHaveLength(8);
  });

  it("fails MOQ check when allocation qty is below supplier MOQ", () => {
    const ctx = baseContext({
      suppliers: {
        "sup-1": {
          supplierId: "sup-1",
          certifications: ["ISO9001"],
          moq: 1000,
          maxCapacityPerCycle: 1000,
          reliabilityScore: 0.9,
          qualityScore: 0.9
        }
      }
    });
    const result = validateRecoveryPlan(basePlan(), ctx);
    expect(result.overallPassed).toBe(false);
    expect(result.checks.find((c) => c.name === "moq")?.passed).toBe(false);
  });

  it("fails certification check when supplier lacks required cert", () => {
    const ctx = baseContext({ requiredCertifications: ["FDA"] });
    const result = validateRecoveryPlan(basePlan(), ctx);
    expect(result.overallPassed).toBe(false);
    expect(result.checks.find((c) => c.name === "certification")?.passed).toBe(false);
  });

  it("fails budget check when totalCost exceeds remaining emergency budget", () => {
    const ctx = baseContext({ emergencyBudgetRemaining: 50000 });
    const result = validateRecoveryPlan(basePlan({ totalCost: 100000 }), ctx);
    expect(result.overallPassed).toBe(false);
    expect(result.checks.find((c) => c.name === "budget")?.passed).toBe(false);
  });

  it("marks withinApprovalThreshold false but does not fail the plan on cost alone", () => {
    const ctx = baseContext({ approvalThreshold: 50000, emergencyBudgetRemaining: 500000 });
    const result = validateRecoveryPlan(basePlan({ totalCost: 100000 }), ctx);
    expect(result.withinApprovalThreshold).toBe(false);
    // approval threshold does not gate overallPassed (§16.8) — only routes EXECUTE vs ESCALATE
    expect(result.overallPassed).toBe(true);
  });

  it("fails deadline check when the latest allocation arrives after the deadline", () => {
    const result = validateRecoveryPlan(
      basePlan({ allocations: [{ supplierId: "sup-1", qty: 600, unitPrice: 100, expectedArrivalDate: daysFromToday(20) }] }),
      baseContext()
    );
    expect(result.checks.find((c) => c.name === "deadline")?.passed).toBe(false);
    expect(result.overallPassed).toBe(false);
  });

  it("fails freshness check when inventory read is stale by more than one cycle", () => {
    const ctx = baseContext({ currentCycle: 5, inventoryReadCycle: 2 });
    const result = validateRecoveryPlan(basePlan(), ctx);
    expect(result.checks.find((c) => c.name === "freshness")?.passed).toBe(false);
    expect(result.overallPassed).toBe(false);
  });

  it("validates split-allocation plans on sum(qty) and sum(cost)", () => {
    const ctx = baseContext({
      suppliers: {
        "sup-1": {
          supplierId: "sup-1",
          certifications: ["ISO9001"],
          moq: 50,
          maxCapacityPerCycle: 300,
          reliabilityScore: 0.9,
          qualityScore: 0.9
        },
        "sup-2": {
          supplierId: "sup-2",
          certifications: ["ISO9001"],
          moq: 50,
          maxCapacityPerCycle: 300,
          reliabilityScore: 0.8,
          qualityScore: 0.8
        }
      }
    });
    const plan = basePlan({
      requiredQty: 600,
      totalCost: 100000,
      allocations: [
        { supplierId: "sup-1", qty: 300, unitPrice: 166, expectedArrivalDate: daysFromToday(2) },
        { supplierId: "sup-2", qty: 300, unitPrice: 167, expectedArrivalDate: daysFromToday(3) }
      ]
    });
    const result = validateRecoveryPlan(plan, ctx);
    expect(result.checks.find((c) => c.name === "splitAllocation")?.passed).toBe(true);
    expect(result.overallPassed).toBe(true);
  });

  it("records all check failures, not just the first", () => {
    const ctx = baseContext({ requiredCertifications: ["FDA"], emergencyBudgetRemaining: 1 });
    const result = validateRecoveryPlan(basePlan(), ctx);
    const failed = result.checks.filter((c) => !c.passed).map((c) => c.name);
    expect(failed).toEqual(expect.arrayContaining(["certification", "budget"]));
  });
});
