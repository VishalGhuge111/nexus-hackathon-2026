// PRD §16 — Deterministic Validator. Pure, no LLM call inside it.
// Runs all 8 checks (does not stop early); every failure is recorded, not just the first.

import { requiredMinimumCoverage } from "../calculations/requiredMinimumCoverage";
import type { ValidationResult } from "../types/validation";
import type { ValidatorContext, ValidatorPlanInput } from "./types";

interface CheckOutcome {
  name: string;
  passed: boolean;
  expected: number | string;
  actual: number | string;
}

function coverageCheck(plan: ValidatorPlanInput, ctx: ValidatorContext): CheckOutcome {
  const result = requiredMinimumCoverage({
    usableStock: ctx.usableStock,
    dailyUsageRate: ctx.dailyUsageRate,
    safetyStockThreshold: ctx.safetyStockThreshold,
    productionRequirement: ctx.productionRequirement,
    deadlineDate: ctx.deadlineDate,
    today: ctx.today,
    incomingDeliveries: plan.allocations.map((a) => ({
      qty: a.qty,
      arrivalDate: a.expectedArrivalDate
    }))
  });
  return {
    name: "coverage",
    passed: result.coverageSufficient,
    expected: "coverageSufficient=true",
    actual: `coverageSufficient=${result.coverageSufficient} (minStock=${result.minProjectedStock})`
  };
}

function deadlineCheck(plan: ValidatorPlanInput, ctx: ValidatorContext): CheckOutcome {
  const latestArrival = plan.allocations.reduce(
    (max, a) => (a.expectedArrivalDate.getTime() > max.getTime() ? a.expectedArrivalDate : max),
    new Date(0)
  );
  const passed = latestArrival.getTime() <= ctx.deadlineDate.getTime();
  return {
    name: "deadline",
    passed,
    expected: ctx.deadlineDate.toISOString(),
    actual: latestArrival.toISOString()
  };
}

function moqCheck(plan: ValidatorPlanInput, ctx: ValidatorContext): CheckOutcome {
  const failures = plan.allocations.filter((a) => {
    const supplier = ctx.suppliers[a.supplierId];
    return !supplier || a.qty < supplier.moq;
  });
  return {
    name: "moq",
    passed: failures.length === 0,
    expected: "all allocations >= supplier MOQ",
    actual:
      failures.length === 0
        ? "all allocations meet MOQ"
        : `${failures.map((f) => f.supplierId).join(",")} below MOQ`
  };
}

function certificationCheck(plan: ValidatorPlanInput, ctx: ValidatorContext): CheckOutcome {
  const failures = plan.allocations.filter((a) => {
    const supplier = ctx.suppliers[a.supplierId];
    if (!supplier) return true;
    return !ctx.requiredCertifications.every((c) => supplier.certifications.includes(c));
  });
  return {
    name: "certification",
    passed: failures.length === 0,
    expected: `all allocations hold [${ctx.requiredCertifications.join(",")}]`,
    actual:
      failures.length === 0
        ? "all allocations certified"
        : `${failures.map((f) => f.supplierId).join(",")} missing certification`
  };
}

function budgetCheck(plan: ValidatorPlanInput, ctx: ValidatorContext): CheckOutcome {
  return {
    name: "budget",
    passed: plan.totalCost <= ctx.emergencyBudgetRemaining,
    expected: `totalCost <= ${ctx.emergencyBudgetRemaining}`,
    actual: plan.totalCost
  };
}

function splitAllocationCheck(plan: ValidatorPlanInput, ctx: ValidatorContext): CheckOutcome {
  if (plan.allocations.length <= 1) {
    return {
      name: "splitAllocation",
      passed: true,
      expected: "n/a (single supplier plan)",
      actual: "n/a"
    };
  }
  const sumQty = plan.allocations.reduce((s, a) => s + a.qty, 0);
  const sumCost = plan.totalCost;
  const qtyOk = sumQty >= plan.requiredQty;
  const costOk = sumCost <= ctx.emergencyBudgetRemaining;
  const allSlicesEligible = plan.allocations.every((a) => {
    const supplier = ctx.suppliers[a.supplierId];
    return (
      !!supplier &&
      a.qty >= supplier.moq &&
      ctx.requiredCertifications.every((c) => supplier.certifications.includes(c))
    );
  });
  return {
    name: "splitAllocation",
    passed: qtyOk && costOk && allSlicesEligible,
    expected: `sum(qty) >= ${plan.requiredQty} AND sum(cost) <= ${ctx.emergencyBudgetRemaining}`,
    actual: `sum(qty)=${sumQty}, sum(cost)=${sumCost}, allSlicesEligible=${allSlicesEligible}`
  };
}

function freshnessCheck(ctx: ValidatorContext): CheckOutcome {
  const passed = ctx.inventoryReadCycle >= ctx.currentCycle - 1;
  return {
    name: "freshness",
    passed,
    expected: `inventoryReadCycle >= ${ctx.currentCycle - 1}`,
    actual: ctx.inventoryReadCycle
  };
}

function approvalThresholdCheck(plan: ValidatorPlanInput, ctx: ValidatorContext): CheckOutcome {
  return {
    name: "approvalThreshold",
    passed: plan.totalCost <= ctx.approvalThreshold,
    expected: `totalCost <= ${ctx.approvalThreshold}`,
    actual: plan.totalCost
  };
}

/**
 * PRD §16 checks 1-7 gate whether the plan may execute at all (`overallPassed`).
 * Check 8 (approval threshold) is informational only — it selects the
 * EXECUTE vs ESCALATE branch and never fails the plan itself.
 */
export function validateRecoveryPlan(
  plan: ValidatorPlanInput,
  ctx: ValidatorContext
): ValidationResult {
  const gatingChecks: CheckOutcome[] = [
    coverageCheck(plan, ctx),
    deadlineCheck(plan, ctx),
    moqCheck(plan, ctx),
    certificationCheck(plan, ctx),
    budgetCheck(plan, ctx),
    splitAllocationCheck(plan, ctx),
    freshnessCheck(ctx)
  ];
  const approvalCheck = approvalThresholdCheck(plan, ctx);

  return {
    planVersionId: plan.planVersionId,
    checks: [...gatingChecks, approvalCheck],
    overallPassed: gatingChecks.every((c) => c.passed),
    withinApprovalThreshold: approvalCheck.passed
  };
}
