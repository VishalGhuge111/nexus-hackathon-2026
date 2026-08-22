// PRD §10 — the Agent Execution FSM. runAgentTick advances exactly one Case by
// exactly one step, per §27 ("advances all OPEN/in-progress Cases one step").
// Nothing here performs arithmetic or eligibility judgment itself — every number
// comes from shared/calculations, every gate from shared/validator or
// shared/supplier/eligibility, every side effect from shared/tools (dispatched
// through the budget+audit choke point in shared/tools/dispatch).
import type { Store } from "../db/types";
import type { Case } from "../types/case";
import type { AgentState } from "../types/agent";
import type { LlmClient } from "../llm/types";
import type { RecoveryPlan } from "../types/procurement";
import { coverageDays, safetyStockRisk, deadlineSlack, productionRequirement, recoveryCost } from "../calculations";
import { evaluateEarlyRiskSignals, shouldOpenEarlyWarning } from "./earlyRiskMonitor";
import { supplierEligibilityCheck } from "../supplier/eligibility";
import { validateRecoveryPlan } from "../validator/validate";
import type { ValidatorAllocation, ValidatorContext, ValidatorPlanInput } from "../validator/types";
import {
  inventoryLookup,
  purchaseOrderLookup,
  productionScheduleLookup,
  shipmentTrackingLookup,
  approvalCheckTool,
  erpUpdateTool,
  escalationCreateTool,
  outcomeRerereadTool
} from "../tools/primitives";
import { dispatchTool } from "../tools/dispatch";
import { newId } from "../util/id";
import { MAX_REPLANS, DEFAULT_MIN_QUALITY_FOR_CASE, DEFAULT_APPROVAL_THRESHOLD } from "../config";

export interface AgentDeps {
  store: Store;
  llm: LlmClient;
}

const REQUIRED_CERTIFICATIONS = ["ISO9001"]; // simplification: one cert regime per SKU in this fixture

async function audit(
  store: Store,
  caseId: string,
  cycle: number,
  actor: "AGENT" | "HUMAN" | "SYSTEM",
  type: "STATE_TRANSITION" | "TOOL_CALL" | "LLM_CALL" | "VALIDATION" | "HUMAN_ACTION",
  summary: string,
  detail: Record<string, unknown> = {}
): Promise<void> {
  await store.appendAuditEvent({
    id: newId("audit"),
    caseId,
    cycle,
    timestamp: new Date().toISOString(),
    actor,
    type,
    summary,
    detail
  });
}

export async function transition(
  store: Store,
  caseRecord: Case,
  agentState: AgentState,
  newStatus: Case["status"],
  reason: string
): Promise<{ case: Case; agentState: AgentState }> {
  const updatedCase = await store.updateCase(caseRecord.id, { status: newStatus });
  agentState.currentStep = newStatus;
  agentState.cycle += 1;
  agentState.updatedAt = new Date().toISOString();
  await store.upsertAgentState(agentState);
  await audit(
    store,
    caseRecord.id,
    agentState.cycle,
    "AGENT",
    "STATE_TRANSITION",
    `${caseRecord.status} -> ${newStatus}: ${reason}`,
    { from: caseRecord.status, to: newStatus }
  );
  return { case: updatedCase, agentState };
}

export async function runAgentTick(
  deps: AgentDeps,
  caseId: string,
  now: Date = new Date()
): Promise<{ case: Case; agentState: AgentState }> {
  const { store } = deps;
  const caseRecord = await store.getCase(caseId);
  if (!caseRecord) throw new Error(`Case ${caseId} not found`);

  const NOOP_STATUSES = new Set([
    "GOAL_ACHIEVED",
    "NO_FEASIBLE_RECOVERY",
    "HUMAN_ESCALATED_AWAITING_DECISION",
    "QUEUED"
  ]);
  const agentState = (await store.getAgentState(caseId)) ?? {
    caseId,
    currentStep: caseRecord.status,
    cycle: 0,
    lastToolCalls: [],
    toolCallCount: 0,
    updatedAt: now.toISOString()
  };

  if (NOOP_STATUSES.has(caseRecord.status)) {
    return { case: caseRecord, agentState };
  }

  agentState.lastToolCalls = [];

  switch (caseRecord.status) {
    case "EARLY_RISK_CHECK":
      return handleEarlyRiskCheck(deps, caseRecord, agentState, now);
    case "VERIFY":
      return handleVerify(deps, caseRecord, agentState, now);
    case "PLAN":
      return handlePlan(deps, caseRecord, agentState, now);
    case "VALIDATE":
      return handleValidate(deps, caseRecord, agentState, now);
    case "EXECUTE_OR_ESCALATE":
      return handleExecuteOrEscalate(deps, caseRecord, agentState, now);
    case "VERIFY_OUTCOME":
      return handleVerifyOutcome(deps, caseRecord, agentState, now);
    case "ADAPT_REPLAN":
      return handleAdaptReplan(deps, caseRecord, agentState, now);
    default:
      // OPEN / MONITORING not exercised by the reactive event path in this slice.
      return { case: caseRecord, agentState };
  }
}

async function handleEarlyRiskCheck(
  { store }: AgentDeps,
  caseRecord: Case,
  agentState: AgentState,
  now: Date
): Promise<{ case: Case; agentState: AgentState }> {
  const dispatchCtx = { store, caseId: caseRecord.id, cycle: agentState.cycle, agentState, invokedBy: "AGENT" as const };

  const productionOrder = await store.getProductionOrder(caseRecord.productionOrderId);
  if (!productionOrder) throw new Error(`ProductionOrder ${caseRecord.productionOrderId} not found`);

  const inventoryResult = await dispatchTool(dispatchCtx, "inventory_lookup", () =>
    inventoryLookup(store, productionOrder.sku)
  );
  await dispatchTool(dispatchCtx, "production_schedule_lookup", () =>
    productionScheduleLookup(store, productionOrder.id)
  );

  if (inventoryResult.status !== "SUCCESS" || !inventoryResult.data) {
    return transition(store, caseRecord, agentState, "VERIFY", "inventory NO_DATA; proceeding to verify with available signals");
  }

  const inventory = inventoryResult.data;
  const coverage = coverageDays({ usableStock: inventory.usableStock, dailyUsageRate: inventory.dailyUsageRate });
  const safety = safetyStockRisk({
    usableStock: inventory.usableStock,
    safetyStockThreshold: inventory.safetyStockThreshold
  });
  const slack = deadlineSlack({
    deadlineDate: new Date(productionOrder.deadlineDate),
    today: now,
    estimatedLeadTimeDays: null,
    supplierDefaultLeadTimeDays: 5
  });
  const slackDays = slack.status === "OK" ? slack.slackDays : null;

  const breaches = evaluateEarlyRiskSignals({
    coverageDays: coverage.coverageDays,
    safetyStockRatio: safety.disabled ? null : safety.ratio,
    deadlineSlackDays: slackDays
  });

  const priorIndicators = caseRecord.riskSignals
    .filter((s) => s.cycle === agentState.cycle - 1)
    .map((s) => s.indicator);
  const opens = shouldOpenEarlyWarning(breaches, priorIndicators);

  for (const breach of breaches) {
    await store.addRiskSignal(caseRecord.id, {
      id: newId("risk"),
      caseId: caseRecord.id,
      indicator: breach.indicator,
      value: breach.value,
      threshold: breach.threshold,
      cycle: agentState.cycle,
      timestamp: now.toISOString(),
      source: "inventory"
    });
  }

  const reason = opens
    ? `${breaches.length} indicator(s) breached: ${breaches.map((b) => b.indicator).join(", ")}`
    : "risk signals present but rule not yet met; continuing to verify given event-triggered origin";
  return transition(store, caseRecord, agentState, "VERIFY", reason);
}

async function handleVerify(
  { store }: AgentDeps,
  caseRecord: Case,
  agentState: AgentState,
  now: Date
): Promise<{ case: Case; agentState: AgentState }> {
  const dispatchCtx = { store, caseId: caseRecord.id, cycle: agentState.cycle, agentState, invokedBy: "AGENT" as const };

  const productionOrder = await store.getProductionOrder(caseRecord.productionOrderId);
  if (!productionOrder) throw new Error(`ProductionOrder ${caseRecord.productionOrderId} not found`);

  const linkedPOs = await store.listPurchaseOrdersByCase(caseRecord.id);
  if (linkedPOs.length === 0) {
    return transition(store, caseRecord, agentState, "MONITORING", "no linked purchase order to verify against; returning to monitoring");
  }
  const po = linkedPOs[0];

  const poResult = await dispatchTool(dispatchCtx, "purchase_order_lookup", () =>
    purchaseOrderLookup(store, po.id)
  );
  const trackingResult = await dispatchTool(dispatchCtx, "shipment_tracking_lookup", () =>
    shipmentTrackingLookup(store, po.id)
  );

  if (poResult.status !== "SUCCESS" || trackingResult.status !== "SUCCESS") {
    const audits = await store.listAuditEvents(caseRecord.id);
    const verifyNoDataCount = audits.filter(a => a.summary.includes("VERIFY inconclusive: NO_DATA") && a.cycle === agentState.cycle).length;
    
    if (verifyNoDataCount >= 2) {
      return transition(store, caseRecord, agentState, "NO_FEASIBLE_RECOVERY", "unverifiable risk after 3 cycles of NO_DATA");
    }

    await audit(store, caseRecord.id, agentState.cycle, "AGENT", "STATE_TRANSITION", `VERIFY inconclusive: NO_DATA, will re-check next cycle (attempt ${verifyNoDataCount + 1})`);
    await store.upsertAgentState(agentState);
    return { case: caseRecord, agentState };
  }

  const freshPo = poResult.data!;
  const willMissDeadline = new Date(freshPo.expectedDeliveryDate).getTime() > new Date(productionOrder.deadlineDate).getTime();

  if (willMissDeadline) {
    return transition(store, caseRecord, agentState, "PLAN", `independent re-read confirms PO ${po.id} will arrive after the deadline`);
  }
  return transition(store, caseRecord, agentState, "MONITORING", `independent re-read shows PO ${po.id} still on time; false positive`);
}

async function handlePlan(
  { store, llm }: AgentDeps,
  caseRecord: Case,
  agentState: AgentState,
  now: Date
): Promise<{ case: Case; agentState: AgentState }> {
  const dispatchCtx = { store, caseId: caseRecord.id, cycle: agentState.cycle, agentState, invokedBy: "AGENT" as const };

  const productionOrder = await store.getProductionOrder(caseRecord.productionOrderId);
  if (!productionOrder) throw new Error(`ProductionOrder ${caseRecord.productionOrderId} not found`);

  const inventoryResult = await dispatchTool(dispatchCtx, "inventory_lookup", () =>
    inventoryLookup(store, productionOrder.sku)
  );
  if (inventoryResult.status !== "SUCCESS" || !inventoryResult.data) {
    await audit(store, caseRecord.id, agentState.cycle, "AGENT", "STATE_TRANSITION", "PLAN blocked: inventory NO_DATA");
    await store.upsertAgentState(agentState);
    return { case: caseRecord, agentState };
  }
  const inventory = inventoryResult.data;

  const requirementResult = productionRequirement({
    plannedQty: productionOrder.plannedQty,
    bomQtyPerUnit: productionOrder.bomQtyPerUnit
  });
  if (requirementResult.status === "NO_DATA") {
    throw new Error("production_requirement NO_DATA: missing BOM ratio");
  }
  const requiredQtyTotal = requirementResult.value;

  const linkedPOs = await store.listPurchaseOrdersByCase(caseRecord.id);
  const onTimeQty = linkedPOs
    .filter((po) => new Date(po.expectedDeliveryDate).getTime() <= new Date(productionOrder.deadlineDate).getTime())
    .reduce((sum, po) => sum + po.qty, 0);
  const shortageQty = Math.max(0, requiredQtyTotal - inventory.usableStock - onTimeQty);

  if (shortageQty === 0) {
    return transition(store, caseRecord, agentState, "VERIFY_OUTCOME", "no shortage projected; verifying goal is already met");
  }

  const deadlineDate = new Date(productionOrder.deadlineDate);
  const daysUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  const excludeSupplierIds = new Set(linkedPOs.map((po) => po.supplierId));
  const allSuppliers = await store.listSuppliers();

  const eligible: { supplierId: string; name: string; pricePerUnit: number; leadTimeDays: number; reliabilityScore: number; qualityScore: number; maxCapacityPerCycle: number; moq: number }[] = [];

  for (const supplier of allSuppliers) {
    const eligibilityResult = await dispatchTool(dispatchCtx, "supplier_eligibility_check", async () => {
      const result = supplierEligibilityCheck(
        {
          supplierId: supplier.id,
          certifications: supplier.certifications,
          moq: supplier.moq,
          maxCapacityPerCycle: supplier.maxCapacityPerCycle,
          reliabilityScore: supplier.reliabilityScore,
          qualityScore: supplier.qualityScore,
          leadTimeDays: supplier.defaultLeadTimeDays,
          hasOpenContradiction: false
        },
        {
          requiredCertifications: REQUIRED_CERTIFICATIONS,
          qty: shortageQty,
          today: now,
          neededBy: deadlineDate,
          deadlineSlackDays: daysUntilDeadline,
          minQualityForCase: DEFAULT_MIN_QUALITY_FOR_CASE
        }
      );
      return { toolName: "supplier_eligibility_check", status: "SUCCESS" as const, data: result, latencyMs: 0 };
    });

    if (eligibilityResult.data?.eligible && !excludeSupplierIds.has(supplier.id)) {
      eligible.push({
        supplierId: supplier.id,
        name: supplier.name,
        pricePerUnit: supplier.pricePerUnit[productionOrder.sku] ?? Number.POSITIVE_INFINITY,
        leadTimeDays: supplier.defaultLeadTimeDays,
        reliabilityScore: supplier.reliabilityScore,
        qualityScore: supplier.qualityScore,
        maxCapacityPerCycle: supplier.maxCapacityPerCycle,
        moq: supplier.moq
      });
    }
  }

  if (eligible.length === 0) {
    await store.updateCase(caseRecord.id, {
      continuityImpact: { unitsAtRisk: shortageQty, deadlineBreached: true }
    });
    return transition(store, caseRecord, agentState, "NO_FEASIBLE_RECOVERY", "no eligible supplier can cover the shortage");
  }

  const pendingRejection = agentState.pendingLlmTask;
  let previousAllocations: { supplierId: string; qty: number; }[] | undefined;
  if (caseRecord.activePlanVersion > 0) {
      const activePlan = await store.getActivePlanVersion(caseRecord.id);
      if (activePlan) {
          previousAllocations = activePlan.plan.allocations.map(a => ({ supplierId: a.supplierId, qty: a.qty }));
      }
  }

  const proposedPlan = await llm.proposeRecoveryPlan({
    caseId: caseRecord.id,
    sku: productionOrder.sku,
    shortageQty,
    today: now.toISOString(),
    deadlineDate: productionOrder.deadlineDate,
    disruptionSummary: `Existing purchase order(s) for ${productionOrder.sku} will not arrive before the production deadline.`,
    eligibleSuppliers: eligible,
    previousPlanRejectionReason: pendingRejection,
    previousPlanAllocations: previousAllocations
  });
  await audit(store, caseRecord.id, agentState.cycle, "AGENT", "LLM_CALL", "Sonnet proposed a recovery plan", {
    allocationCount: proposedPlan.allocations.length,
    rationale: proposedPlan.rationale
  });

  const allocations = proposedPlan.allocations.map((a) => {
    const supplier = eligible.find((s) => s.supplierId === a.supplierId);
    if (!supplier) throw new Error(`Proposed plan referenced non-eligible supplier ${a.supplierId}`);
    const arrival = new Date(now.getTime() + supplier.leadTimeDays * 24 * 60 * 60 * 1000);
    return {
      supplierId: a.supplierId,
      qty: a.qty,
      unitPrice: supplier.pricePerUnit,
      expectedArrivalDate: arrival.toISOString()
    };
  });

  const totalCost = recoveryCost(allocations.map((a) => ({ unitPrice: a.unitPrice, qty: a.qty })));
  const recoveryPlan: RecoveryPlan = {
    id: newId("plan"),
    caseId: caseRecord.id,
    versionId: newId("planversion"),
    allocations: allocations.map((a) => ({ supplierId: a.supplierId, qty: a.qty, unitPrice: a.unitPrice })),
    totalCost,
    expectedDeliveryDate: allocations.reduce(
      (max, a) => (a.expectedArrivalDate > max ? a.expectedArrivalDate : max),
      allocations[0].expectedArrivalDate
    )
  };

  const newVersion = caseRecord.activePlanVersion + 1;
  await store.createRecoveryPlanVersion({
    id: newId("pv"),
    version: newVersion,
    caseId: caseRecord.id,
    parent_version: caseRecord.activePlanVersion || null,
    plan: recoveryPlan,
    invalidated_assumptions: pendingRejection ? [`prior plan rejected: ${pendingRejection}`] : [],
    carried_forward_actions: pendingRejection ? ["shortageQty and eligible supplier pool carried forward unchanged"] : [],
    reason_for_change: pendingRejection ?? "initial plan proposal",
    triggering_event: pendingRejection ?? "VERIFY confirmed disruption",
    status: "ACTIVE",
    createdAt: now.toISOString()
  });

  agentState.pendingLlmTask = undefined;
  await store.updateCase(caseRecord.id, { activePlanVersion: newVersion });
  const refreshed = { ...caseRecord, activePlanVersion: newVersion };
  return transition(store, refreshed, agentState, "VALIDATE", `plan v${newVersion} proposed, covering shortage of ${shortageQty} units`);
}

async function handleValidate(
  { store }: AgentDeps,
  caseRecord: Case,
  agentState: AgentState,
  now: Date
): Promise<{ case: Case; agentState: AgentState }> {
  const productionOrder = await store.getProductionOrder(caseRecord.productionOrderId);
  if (!productionOrder) throw new Error(`ProductionOrder ${caseRecord.productionOrderId} not found`);
  const inventory = await store.getInventoryRecordBySku(productionOrder.sku);
  if (!inventory) throw new Error(`InventoryRecord for ${productionOrder.sku} not found`);

  const planVersion = await store.getActivePlanVersion(caseRecord.id);
  if (!planVersion) throw new Error(`No active plan version for case ${caseRecord.id}`);
  const plan = planVersion.plan;

  const allSuppliers = await store.listSuppliers();
  const supplierMap: ValidatorContext["suppliers"] = {};
  for (const s of allSuppliers) {
    supplierMap[s.id] = {
      supplierId: s.id,
      certifications: s.certifications,
      moq: s.moq,
      maxCapacityPerCycle: s.maxCapacityPerCycle,
      reliabilityScore: s.reliabilityScore,
      qualityScore: s.qualityScore
    };
  }

  const requirementResult = productionRequirement({
    plannedQty: productionOrder.plannedQty,
    bomQtyPerUnit: productionOrder.bomQtyPerUnit
  });
  const productionRequirementValue = requirementResult.status === "OK" ? requirementResult.value : 0;

  const linkedPOs = await store.listPurchaseOrdersByCase(caseRecord.id);
  const requiredQty = Math.max(
    0,
    productionRequirementValue -
      inventory.usableStock -
      linkedPOs
        .filter((po) => new Date(po.expectedDeliveryDate).getTime() <= new Date(productionOrder.deadlineDate).getTime())
        .reduce((s, po) => s + po.qty, 0)
  );

  const budget = await store.getEmergencyBudget();

  const validatorAllocations: ValidatorAllocation[] = plan.allocations.map((a) => ({
    supplierId: a.supplierId,
    qty: a.qty,
    unitPrice: a.unitPrice,
    expediteFee: a.expediteFee,
    expectedArrivalDate: new Date(plan.expectedDeliveryDate)
  }));

  const planInput: ValidatorPlanInput = {
    planVersionId: planVersion.id,
    caseId: caseRecord.id,
    totalCost: plan.totalCost,
    requiredQty,
    allocations: validatorAllocations
  };

  const ctx: ValidatorContext = {
    today: now,
    usableStock: inventory.usableStock,
    dailyUsageRate: inventory.dailyUsageRate,
    safetyStockThreshold: inventory.safetyStockThreshold,
    productionRequirement: productionRequirementValue,
    deadlineDate: new Date(productionOrder.deadlineDate),
    emergencyBudgetRemaining: budget.remainingAmount,
    approvalThreshold: DEFAULT_APPROVAL_THRESHOLD,
    requiredCertifications: REQUIRED_CERTIFICATIONS,
    suppliers: supplierMap,
    currentCycle: agentState.cycle,
    inventoryReadCycle: agentState.cycle,
    eligibilityCheckedCycle: {}
  };

  const result = validateRecoveryPlan(planInput, ctx);
  await store.createValidationResult({ id: newId("vr"), ...result });
  await audit(store, caseRecord.id, agentState.cycle, "AGENT", "VALIDATION", `Validator: ${result.overallPassed ? "PASSED" : "FAILED"}`, {
    checks: result.checks,
    overallPassed: result.overallPassed,
    withinApprovalThreshold: result.withinApprovalThreshold
  });

  if (result.overallPassed) {
    return transition(store, caseRecord, agentState, "EXECUTE_OR_ESCALATE", "plan passed all validator checks");
  }
  const failedNames = result.checks.filter((c) => !c.passed).map((c) => c.name).join(", ");
  agentState.pendingLlmTask = `validator rejected plan v${caseRecord.activePlanVersion} on: ${failedNames}`;
  return transition(store, caseRecord, agentState, "ADAPT_REPLAN", `plan failed checks: ${failedNames}`);
}

async function handleExecuteOrEscalate(
  { store, llm }: AgentDeps,
  caseRecord: Case,
  agentState: AgentState,
  now: Date
): Promise<{ case: Case; agentState: AgentState }> {
  const dispatchCtx = { store, caseId: caseRecord.id, cycle: agentState.cycle, agentState, invokedBy: "AGENT" as const };

  const planVersion = await store.getActivePlanVersion(caseRecord.id);
  if (!planVersion) throw new Error(`No active plan version for case ${caseRecord.id}`);
  const plan = planVersion.plan;

  const productionOrder = await store.getProductionOrder(caseRecord.productionOrderId);
  const policyFlagged = productionOrder?.priority === "CRITICAL";

  const approvalResult = await dispatchTool(dispatchCtx, "approval_check", () =>
    approvalCheckTool(store, plan.totalCost, policyFlagged)
  );
  const { approvalRequired, approvalReason } = approvalResult.data!;

  if (approvalRequired) {
    const validationResult = await store.getLatestValidationResult(planVersion.id);
    const brief = await llm.draftEscalationBrief({
      caseId: caseRecord.id,
      planSummary: `${plan.allocations.length} allocation(s), total cost ${plan.totalCost}`,
      validationSummary: validationResult ? `all ${validationResult.checks.length} checks passed` : "validated",
      approvalReason
    });
    await dispatchTool(dispatchCtx, "escalation_create", () =>
      escalationCreateTool(store, { caseId: caseRecord.id, planVersionId: planVersion.id, brief })
    );
    const budget = await store.getEmergencyBudget();
    await store.updateEmergencyBudget({ reservedAmount: budget.reservedAmount + plan.totalCost });
    return transition(store, caseRecord, agentState, "HUMAN_ESCALATED_AWAITING_DECISION", approvalReason);
  }

  return executeApprovedPlan({ store }, caseRecord, agentState, plan, now);
}

export async function executeApprovedPlan(
  { store }: { store: Store },
  caseRecord: Case,
  agentState: AgentState,
  plan: RecoveryPlan,
  now: Date
): Promise<{ case: Case; agentState: AgentState }> {
  const dispatchCtx = { store, caseId: caseRecord.id, cycle: agentState.cycle, agentState, invokedBy: "AGENT" as const };
  const productionOrder = await store.getProductionOrder(caseRecord.productionOrderId);
  if (!productionOrder) throw new Error(`ProductionOrder ${caseRecord.productionOrderId} not found`);

  const erpResult = await dispatchTool(dispatchCtx, "erp_update", () =>
    erpUpdateTool(store, {
      caseId: caseRecord.id,
      sku: productionOrder.sku,
      allocations: plan.allocations.map((a) => ({
        supplierId: a.supplierId,
        qty: a.qty,
        unitPrice: a.unitPrice,
        expediteFee: a.expediteFee,
        expectedDeliveryDate: plan.expectedDeliveryDate
      })),
      totalCost: plan.totalCost
    })
  );

  if (erpResult.status !== "SUCCESS") {
    agentState.pendingLlmTask = `erp_update failed: ${erpResult.errorReason}`;
    return transition(store, caseRecord, agentState, "ADAPT_REPLAN", `execution failed: ${erpResult.errorReason}`);
  }

  return transition(store, caseRecord, agentState, "VERIFY_OUTCOME", "plan executed; verifying outcome next cycle");
}

async function handleVerifyOutcome(
  { store }: AgentDeps,
  caseRecord: Case,
  agentState: AgentState,
  now: Date
): Promise<{ case: Case; agentState: AgentState }> {
  const dispatchCtx = { store, caseId: caseRecord.id, cycle: agentState.cycle, agentState, invokedBy: "AGENT" as const };

  const productionOrder = await store.getProductionOrder(caseRecord.productionOrderId);
  if (!productionOrder) throw new Error(`ProductionOrder ${caseRecord.productionOrderId} not found`);

  const rereadResult = await dispatchTool(dispatchCtx, "outcome_reread", () =>
    outcomeRerereadTool(store, { sku: productionOrder.sku, productionOrderId: productionOrder.id, caseId: caseRecord.id })
  );

  if (rereadResult.status !== "SUCCESS" || !rereadResult.data) {
    await audit(store, caseRecord.id, agentState.cycle, "AGENT", "STATE_TRANSITION", "outcome_reread NO_DATA; will retry");
    await store.upsertAgentState(agentState);
    return { case: caseRecord, agentState };
  }

  const { inventory, purchaseOrders } = rereadResult.data;
  const requirementResult = productionRequirement({
    plannedQty: productionOrder.plannedQty,
    bomQtyPerUnit: productionOrder.bomQtyPerUnit
  });
  const requiredQtyTotal = requirementResult.status === "OK" ? requirementResult.value : Infinity;

  const onTimeQty = purchaseOrders
    .filter((po) => new Date(po.expectedDeliveryDate).getTime() <= new Date(productionOrder.deadlineDate).getTime())
    .reduce((sum, po) => sum + po.qty, 0);
  const totalAvailable = inventory.usableStock + onTimeQty;
  const deadlineBreached = totalAvailable < requiredQtyTotal;

  await store.updateCase(caseRecord.id, {
    continuityImpact: { unitsAtRisk: Math.max(0, requiredQtyTotal - totalAvailable), deadlineBreached }
  });

  if (!deadlineBreached) {
    return transition(store, caseRecord, agentState, "GOAL_ACHIEVED", "outcome_reread confirms production requirement is now covered before the deadline");
  }
  agentState.pendingLlmTask = "outcome_reread showed the goal was still not met after execution";
  return transition(store, caseRecord, agentState, "ADAPT_REPLAN", "execution succeeded but outcome_reread shows the goal is still not met");
}

async function handleAdaptReplan(
  { store }: AgentDeps,
  caseRecord: Case,
  agentState: AgentState,
  now: Date
): Promise<{ case: Case; agentState: AgentState }> {
  if (caseRecord.replanCount >= MAX_REPLANS) {
    return transition(store, caseRecord, agentState, "NO_FEASIBLE_RECOVERY", `replan cap (${MAX_REPLANS}) reached with no passing plan`);
  }
  const updated = await store.updateCase(caseRecord.id, { replanCount: caseRecord.replanCount + 1 });
  return transition(store, updated, agentState, "PLAN", `replanning (attempt ${updated.replanCount}) with new evidence`);
}
