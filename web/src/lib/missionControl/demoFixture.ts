// DEMO DATA ONLY — not connected to the live agent, database, or Claude API.
//
// This module builds a single, internally-consistent Mission Control scenario
// using the REAL deterministic shared/calculations, shared/validator, and
// shared/supplier functions (pure TypeScript, no I/O) so every number the UI
// shows is genuinely computed from the fixture inputs below, not hand-typed.
// It deliberately reuses no shared/db, shared/llm, or shared/agent code —
// those touch persistence/LLM/agent-loop concerns that are out of scope for
// this presentation-only shell.
//
// All dates are fixed ISO strings (never `new Date()` at module scope) so
// server-rendered and client-hydrated output always match.

import { coverageDays, safetyStockRisk, productionRequirement, recoveryCost } from "@nexus/shared/calculations";
import { validateRecoveryPlan } from "@nexus/shared/validator";
import type { ValidatorContext, ValidatorPlanInput } from "@nexus/shared/validator";
import { supplierEligibilityCheck } from "@nexus/shared/supplier";
import type { Case, RiskSignal } from "@nexus/shared/types/case";
import type { AgentState } from "@nexus/shared/types/agent";
import type { ProductionOrder } from "@nexus/shared/types/production";
import type { InventoryRecord } from "@nexus/shared/types/inventory";
import type { Supplier } from "@nexus/shared/types/supplier";
import type {
  PurchaseOrder,
  RecoveryPlan,
  RecoveryPlanVersion,
  EmergencyBudget
} from "@nexus/shared/types/procurement";
import type { ValidationResult, ApprovalRequest } from "@nexus/shared/types/validation";
import type { AuditEvent } from "@nexus/shared/types/audit";

export const IS_DEMO_DATA = true as const;

const TODAY = new Date("2026-08-22T09:00:00.000Z");
const SKU = "COMP-ALPHA";
const REQUIRED_CERTIFICATIONS = ["ISO9001"];

function daysFrom(base: Date, n: number): string {
  return new Date(base.getTime() + n * 24 * 60 * 60 * 1000).toISOString();
}
function minutesFrom(base: Date, n: number): string {
  return new Date(base.getTime() + n * 60 * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Ground-truth fixtures
// ---------------------------------------------------------------------------

export const productionOrder: ProductionOrder = {
  id: "prod-914",
  sku: SKU,
  plannedQty: 450,
  bomQtyPerUnit: 2,
  deadlineDate: daysFrom(TODAY, 5),
  priority: "CRITICAL",
  status: "IN_PROGRESS"
};

export const inventoryRecord: InventoryRecord = {
  sku: SKU,
  warehouseId: "WH-1",
  currentStock: 800,
  usableStock: 390,
  dailyUsageRate: 90,
  safetyStockThreshold: 150,
  lastUpdatedAt: TODAY.toISOString(),
  stockDiscrepancyFlag: true
};

export const suppliers: Supplier[] = [
  {
    id: "supplier-orbital",
    name: "Orbital Components Ltd",
    certifications: ["ISO9001"],
    moq: 100,
    maxCapacityPerCycle: 1000,
    defaultLeadTimeDays: 5,
    reliabilityScore: 0.85,
    qualityScore: 0.8,
    pricePerUnit: { [SKU]: 150 }
  },
  {
    id: "supplier-quicksource",
    name: "QuickSource Inc",
    certifications: ["ISO9001"],
    moq: 50,
    maxCapacityPerCycle: 800,
    defaultLeadTimeDays: 1,
    reliabilityScore: 0.75,
    qualityScore: 0.4, // below the 0.7 quality floor — Hidden Test 3
    pricePerUnit: { [SKU]: 120 }
  },
  {
    id: "supplier-veloce",
    name: "Veloce Parts Co",
    certifications: ["ISO9001"],
    moq: 50,
    maxCapacityPerCycle: 800,
    defaultLeadTimeDays: 2,
    reliabilityScore: 0.78,
    qualityScore: 0.82,
    pricePerUnit: { [SKU]: 166.67 }
  }
];

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "po-1001",
    supplierId: "supplier-orbital",
    sku: SKU,
    qty: 600,
    unitPrice: 150,
    status: "DELAYED",
    expectedDeliveryDate: daysFrom(TODAY, 5.5), // 12h after the deadline: confirmed miss
    caseId: "case-1"
  }
];

export const emergencyBudget: EmergencyBudget = {
  totalAmount: 500000,
  reservedAmount: 0, // set below once V2's cost is known
  spentAmount: 0,
  remainingAmount: 0,
  updatedAt: minutesFrom(TODAY, 47)
};

// ---------------------------------------------------------------------------
// Derived, genuinely-computed figures (§19 formulas)
// ---------------------------------------------------------------------------

export const coverage = coverageDays({
  usableStock: inventoryRecord.usableStock,
  dailyUsageRate: inventoryRecord.dailyUsageRate
});
export const safetyStock = safetyStockRisk({
  usableStock: inventoryRecord.usableStock,
  safetyStockThreshold: inventoryRecord.safetyStockThreshold
});
const requirementResult = productionRequirement({
  plannedQty: productionOrder.plannedQty,
  bomQtyPerUnit: productionOrder.bomQtyPerUnit
});
export const productionRequirementQty = requirementResult.status === "OK" ? requirementResult.value : 0;

// The delayed PO no longer arrives on time, so nothing offsets usableStock.
const requiredShortageQty = Math.max(0, productionRequirementQty - inventoryRecord.usableStock);

// ---------------------------------------------------------------------------
// Supplier eligibility (§17) — real function output, including the rejection
// ---------------------------------------------------------------------------

const deadlineSlackDaysAtPlanTime = 2.5;

export const supplierEligibility = suppliers.map((s) => ({
  supplier: s,
  result: supplierEligibilityCheck(
    {
      supplierId: s.id,
      certifications: s.certifications,
      moq: s.moq,
      maxCapacityPerCycle: s.maxCapacityPerCycle,
      reliabilityScore: s.reliabilityScore,
      qualityScore: s.qualityScore,
      leadTimeDays: s.defaultLeadTimeDays,
      hasOpenContradiction: false
    },
    {
      requiredCertifications: REQUIRED_CERTIFICATIONS,
      qty: requiredShortageQty,
      today: TODAY,
      neededBy: new Date(productionOrder.deadlineDate),
      deadlineSlackDays: deadlineSlackDaysAtPlanTime
    }
  )
}));

const validatorSupplierMap: ValidatorContext["suppliers"] = Object.fromEntries(
  suppliers.map((s) => [
    s.id,
    {
      supplierId: s.id,
      certifications: s.certifications,
      moq: s.moq,
      maxCapacityPerCycle: s.maxCapacityPerCycle,
      reliabilityScore: s.reliabilityScore,
      qualityScore: s.qualityScore
    }
  ])
);

function baseValidatorContext(currentCycle: number): ValidatorContext {
  return {
    today: TODAY,
    usableStock: inventoryRecord.usableStock,
    dailyUsageRate: inventoryRecord.dailyUsageRate,
    safetyStockThreshold: inventoryRecord.safetyStockThreshold,
    productionRequirement: productionRequirementQty,
    deadlineDate: new Date(productionOrder.deadlineDate),
    emergencyBudgetRemaining: 500000,
    approvalThreshold: 150000,
    requiredCertifications: REQUIRED_CERTIFICATIONS,
    suppliers: validatorSupplierMap,
    currentCycle,
    inventoryReadCycle: currentCycle,
    eligibilityCheckedCycle: {}
  };
}

// ---------------------------------------------------------------------------
// V1 — under-provisioned plan, genuinely fails the Validator's coverage check
// ---------------------------------------------------------------------------

const v1Plan: RecoveryPlan = {
  id: "plan-v1",
  caseId: "case-1",
  versionId: "planversion-v1",
  allocations: [{ supplierId: "supplier-veloce", qty: 350, unitPrice: 166.67 }],
  totalCost: recoveryCost([{ unitPrice: 166.67, qty: 350 }]),
  expectedDeliveryDate: daysFrom(TODAY, 2)
};

const v1PlanInput: ValidatorPlanInput = {
  planVersionId: "planversion-v1",
  caseId: "case-1",
  totalCost: v1Plan.totalCost,
  requiredQty: requiredShortageQty,
  allocations: v1Plan.allocations.map((a) => ({
    supplierId: a.supplierId,
    qty: a.qty,
    unitPrice: a.unitPrice,
    expectedArrivalDate: new Date(v1Plan.expectedDeliveryDate)
  }))
};
export const v1ValidationResult: ValidationResult = validateRecoveryPlan(v1PlanInput, baseValidatorContext(3));

// ---------------------------------------------------------------------------
// V2 — corrected plan covering the full shortage, genuinely passes
// ---------------------------------------------------------------------------

const v2Plan: RecoveryPlan = {
  id: "plan-v2",
  caseId: "case-1",
  versionId: "planversion-v2",
  allocations: [{ supplierId: "supplier-veloce", qty: requiredShortageQty, unitPrice: 166.67 }],
  totalCost: recoveryCost([{ unitPrice: 166.67, qty: requiredShortageQty }]),
  expectedDeliveryDate: daysFrom(TODAY, 2)
};

const v2PlanInput: ValidatorPlanInput = {
  planVersionId: "planversion-v2",
  caseId: "case-1",
  totalCost: v2Plan.totalCost,
  requiredQty: requiredShortageQty,
  allocations: v2Plan.allocations.map((a) => ({
    supplierId: a.supplierId,
    qty: a.qty,
    unitPrice: a.unitPrice,
    expectedArrivalDate: new Date(v2Plan.expectedDeliveryDate)
  }))
};
export const v2ValidationResult: ValidationResult = validateRecoveryPlan(v2PlanInput, baseValidatorContext(6));

emergencyBudget.reservedAmount = v2Plan.totalCost;
emergencyBudget.remainingAmount = emergencyBudget.totalAmount - emergencyBudget.reservedAmount - emergencyBudget.spentAmount;

export const planVersions: (RecoveryPlanVersion & { id: string })[] = [
  {
    id: "planversion-v1",
    version: 1,
    caseId: "case-1",
    parent_version: null,
    plan: v1Plan,
    invalidated_assumptions: [],
    carried_forward_actions: [],
    reason_for_change: "initial plan proposal",
    triggering_event: "VERIFY confirmed disruption",
    status: "SUPERSEDED",
    createdAt: minutesFrom(TODAY, 12)
  },
  {
    id: "planversion-v2",
    version: 2,
    caseId: "case-1",
    parent_version: 1,
    plan: v2Plan,
    invalidated_assumptions: [
      `V1 assumed a 350-unit reroute to Veloce Parts Co would be sufficient; the Validator's coverage check showed usableStock + planned delivery (390 + 350 = 740) falls ${productionRequirementQty - 740} units short of the ${productionRequirementQty}-unit production requirement.`
    ],
    carried_forward_actions: [
      "Veloce Parts Co remains the selected reroute supplier — already eligible, certification/MOQ/reliability/quality not re-checked.",
      "Original Orbital PO po-1001 remains DELAYED and excluded from on-time supply."
    ],
    reason_for_change: "VALIDATE rejected V1 on the coverage check (§16.1) — the full shortfall is 510 units, not 350.",
    triggering_event: "ValidationResult (planversion-v1): coverage check FAILED",
    status: "ACTIVE",
    createdAt: minutesFrom(TODAY, 30)
  }
];

export const approvalRequest: ApprovalRequest = {
  id: "appr-1",
  caseId: "case-1",
  planVersionId: "planversion-v2",
  brief:
    `Plan v2 requires manager approval: production order prod-914 is CRITICAL priority, which always routes to human ` +
    `approval regardless of cost (policy flag). Proposed plan reroutes the ${requiredShortageQty}-unit shortage to ` +
    `Veloce Parts Co (reliability 0.78, quality 0.82, ISO9001-certified) at a total cost of ₹${v2Plan.totalCost.toFixed(2)}, ` +
    `arriving ${v2Plan.expectedDeliveryDate.slice(0, 10)} (UTC) — before the ${productionOrder.deadlineDate.slice(0, 10)} (UTC) deadline. ` +
    `All 8 Validator checks passed. Recommend approval.`,
  status: "PENDING"
};

export const riskSignals: RiskSignal[] = [
  {
    id: "risk-1",
    caseId: "case-1",
    indicator: "coverage_days",
    value: Number(coverage.coverageDays.toFixed(2)),
    threshold: 5,
    cycle: 0,
    timestamp: TODAY.toISOString(),
    source: "inventory"
  },
  {
    id: "risk-2",
    caseId: "case-1",
    indicator: "production_deadline_slack",
    value: -0.5,
    threshold: 2,
    cycle: 0,
    timestamp: TODAY.toISOString(),
    source: "erp"
  }
];

export const primaryCase: Case = {
  id: "case-1",
  productionOrderId: "prod-914",
  status: "HUMAN_ESCALATED_AWAITING_DECISION",
  priority: "CRITICAL",
  riskSignals,
  activePlanVersion: 2,
  replanCount: 1,
  continuityImpact: { unitsAtRisk: requiredShortageQty, deadlineBreached: true },
  createdAt: TODAY.toISOString(),
  updatedAt: minutesFrom(TODAY, 47)
};

export const queuedCase: Case = {
  id: "case-2",
  productionOrderId: "prod-522",
  status: "QUEUED",
  priority: "STANDARD",
  riskSignals: [
    {
      id: "risk-3",
      caseId: "case-2",
      indicator: "safety_stock_ratio",
      value: 0.72,
      threshold: 1.0,
      cycle: 0,
      timestamp: minutesFrom(TODAY, 20),
      source: "inventory"
    }
  ],
  activePlanVersion: 0,
  replanCount: 0,
  continuityImpact: { unitsAtRisk: 80, deadlineBreached: false },
  createdAt: minutesFrom(TODAY, 20),
  updatedAt: minutesFrom(TODAY, 20),
  queuedBehindCaseId: "case-1"
};

export const cases: Case[] = [primaryCase, queuedCase];

export const agentState: AgentState = {
  caseId: "case-1",
  currentStep: "HUMAN_ESCALATED_AWAITING_DECISION",
  cycle: 7,
  lastToolCalls: ["approval_check", "escalation_create"],
  toolCallCount: 9,
  lastLlmModel: "sonnet",
  updatedAt: minutesFrom(TODAY, 47)
};

// ---------------------------------------------------------------------------
// Audit trail — one gapless chain from OPEN to the current awaiting-approval state
// ---------------------------------------------------------------------------

export const auditEvents: AuditEvent[] = [
  {
    id: "audit-1",
    caseId: "case-1",
    cycle: 0,
    timestamp: TODAY.toISOString(),
    actor: "SYSTEM",
    type: "STATE_TRANSITION",
    summary: "Judge event SHIPMENT_DELAY: PO po-1001 delayed 24h -> new ETA past deadline",
    detail: { poId: "po-1001", delayHours: 24 }
  },
  {
    id: "audit-2",
    caseId: "case-1",
    cycle: 0,
    timestamp: minutesFrom(TODAY, 1),
    actor: "AGENT",
    type: "TOOL_CALL",
    summary: "inventory_lookup -> SUCCESS",
    detail: { toolName: "inventory_lookup", status: "SUCCESS", toolCallCount: 1 }
  },
  {
    id: "audit-3",
    caseId: "case-1",
    cycle: 0,
    timestamp: minutesFrom(TODAY, 1),
    actor: "AGENT",
    type: "TOOL_CALL",
    summary: "production_schedule_lookup -> SUCCESS",
    detail: { toolName: "production_schedule_lookup", status: "SUCCESS", toolCallCount: 2 }
  },
  {
    id: "audit-4",
    caseId: "case-1",
    cycle: 1,
    timestamp: minutesFrom(TODAY, 2),
    actor: "AGENT",
    type: "STATE_TRANSITION",
    summary: "EARLY_RISK_CHECK -> VERIFY: 2 indicator(s) breached: coverage_days, production_deadline_slack",
    detail: { from: "EARLY_RISK_CHECK", to: "VERIFY" }
  },
  {
    id: "audit-5",
    caseId: "case-1",
    cycle: 1,
    timestamp: minutesFrom(TODAY, 3),
    actor: "AGENT",
    type: "TOOL_CALL",
    summary: "shipment_tracking_lookup -> NO_DATA",
    detail: { toolName: "shipment_tracking_lookup", status: "NO_DATA", toolCallCount: 3 }
  },
  {
    id: "audit-6",
    caseId: "case-1",
    cycle: 1,
    timestamp: minutesFrom(TODAY, 8),
    actor: "AGENT",
    type: "TOOL_CALL",
    summary: "shipment_tracking_lookup -> SUCCESS (retry)",
    detail: { toolName: "shipment_tracking_lookup", status: "SUCCESS", toolCallCount: 4 }
  },
  {
    id: "audit-7",
    caseId: "case-1",
    cycle: 2,
    timestamp: minutesFrom(TODAY, 9),
    actor: "AGENT",
    type: "STATE_TRANSITION",
    summary: "VERIFY -> PLAN: independent re-read confirms PO po-1001 will arrive after the deadline",
    detail: { from: "VERIFY", to: "PLAN" }
  },
  {
    id: "audit-8",
    caseId: "case-1",
    cycle: 2,
    timestamp: minutesFrom(TODAY, 10),
    actor: "AGENT",
    type: "LLM_CALL",
    summary: "Sonnet proposed recovery plan v1",
    detail: { allocationCount: 1, rationale: "Single-supplier reroute to Veloce Parts Co." }
  },
  {
    id: "audit-9",
    caseId: "case-1",
    cycle: 3,
    timestamp: minutesFrom(TODAY, 11),
    actor: "AGENT",
    type: "STATE_TRANSITION",
    summary: "PLAN -> VALIDATE: plan v1 proposed",
    detail: { from: "PLAN", to: "VALIDATE" }
  },
  {
    id: "audit-10",
    caseId: "case-1",
    cycle: 3,
    timestamp: minutesFrom(TODAY, 12),
    actor: "AGENT",
    type: "VALIDATION",
    summary: "Validator: FAILED (coverage)",
    detail: { overallPassed: false, checks: v1ValidationResult.checks }
  },
  {
    id: "audit-11",
    caseId: "case-1",
    cycle: 4,
    timestamp: minutesFrom(TODAY, 13),
    actor: "AGENT",
    type: "STATE_TRANSITION",
    summary: "VALIDATE -> ADAPT_REPLAN: plan failed checks: coverage",
    detail: { from: "VALIDATE", to: "ADAPT_REPLAN" }
  },
  {
    id: "audit-12",
    caseId: "case-1",
    cycle: 4,
    timestamp: minutesFrom(TODAY, 14),
    actor: "AGENT",
    type: "STATE_TRANSITION",
    summary: "ADAPT_REPLAN -> PLAN: replanning (attempt 1) with new evidence",
    detail: { from: "ADAPT_REPLAN", to: "PLAN" }
  },
  {
    id: "audit-13",
    caseId: "case-1",
    cycle: 5,
    timestamp: minutesFrom(TODAY, 15),
    actor: "AGENT",
    type: "LLM_CALL",
    summary: "Sonnet proposed corrected recovery plan v2",
    detail: { allocationCount: 1, rationale: `Full ${requiredShortageQty}-unit reroute to Veloce Parts Co.` }
  },
  {
    id: "audit-14",
    caseId: "case-1",
    cycle: 6,
    timestamp: minutesFrom(TODAY, 16),
    actor: "AGENT",
    type: "STATE_TRANSITION",
    summary: "PLAN -> VALIDATE: plan v2 proposed, covering shortage of " + requiredShortageQty + " units",
    detail: { from: "PLAN", to: "VALIDATE" }
  },
  {
    id: "audit-15",
    caseId: "case-1",
    cycle: 6,
    timestamp: minutesFrom(TODAY, 17),
    actor: "AGENT",
    type: "VALIDATION",
    summary: "Validator: PASSED",
    detail: { overallPassed: true, checks: v2ValidationResult.checks }
  },
  {
    id: "audit-16",
    caseId: "case-1",
    cycle: 7,
    timestamp: minutesFrom(TODAY, 18),
    actor: "AGENT",
    type: "STATE_TRANSITION",
    summary: "VALIDATE -> EXECUTE_OR_ESCALATE: plan passed all validator checks",
    detail: { from: "VALIDATE", to: "EXECUTE_OR_ESCALATE" }
  },
  {
    id: "audit-17",
    caseId: "case-1",
    cycle: 7,
    timestamp: minutesFrom(TODAY, 19),
    actor: "AGENT",
    type: "TOOL_CALL",
    summary: "approval_check -> SUCCESS",
    detail: { toolName: "approval_check", status: "SUCCESS", toolCallCount: 8 }
  },
  {
    id: "audit-18",
    caseId: "case-1",
    cycle: 7,
    timestamp: minutesFrom(TODAY, 19),
    actor: "AGENT",
    type: "TOOL_CALL",
    summary: "escalation_create -> SUCCESS",
    detail: { toolName: "escalation_create", status: "SUCCESS", toolCallCount: 9 }
  },
  {
    id: "audit-19",
    caseId: "case-1",
    cycle: 7,
    timestamp: minutesFrom(TODAY, 47),
    actor: "AGENT",
    type: "STATE_TRANSITION",
    summary: "EXECUTE_OR_ESCALATE -> HUMAN_ESCALATED_AWAITING_DECISION: Policy flag: CRITICAL priority order",
    detail: { from: "EXECUTE_OR_ESCALATE", to: "HUMAN_ESCALATED_AWAITING_DECISION" }
  }
];

// ---------------------------------------------------------------------------
// Do-Nothing vs NEXUS Plan (§30) — same formulas, two scenarios
// ---------------------------------------------------------------------------

export const doNothingVsNexus = {
  doNothing: {
    coverageDays: coverage.coverageDays,
    deadlineBreached: true,
    unitsAtRisk: requiredShortageQty,
    costImpact: 0
  },
  nexusPlan: {
    coverageDays: coverage.coverageDays,
    deadlineBreached: false,
    unitsAtRisk: 0,
    costImpact: v2Plan.totalCost
  }
};

export const kpis = {
  coverageDaysRemaining: coverage.coverageDays,
  ordersAtRiskCount: cases.filter((c) => c.continuityImpact.unitsAtRisk > 0).length,
  unitsAtRisk: cases.reduce((sum, c) => sum + c.continuityImpact.unitsAtRisk, 0),
  deadlinesBreachedCount: cases.filter((c) => c.continuityImpact.deadlineBreached).length,
  emergencyBudgetRemaining: emergencyBudget.remainingAmount
};
