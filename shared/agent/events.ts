// PRD §31 — judge-selectable live events. Each mutates real simulated ground truth
// and is followed by an immediate agent tick (done by the caller, e.g. the
// /api/agent/event route), not a wait for the next cron cycle.
import type { Store } from "../db/types";
import type { SupplierMessage } from "../types/supplier";
import { newId } from "../util/id";

export type DisruptionEventType =
  | "SHIPMENT_DELAY"
  | "SUPPLIER_CAPACITY_DROP"
  | "DEMAND_SPIKE"
  | "SUPPLIER_CLAIM_CONTRADICTION";

export interface ShipmentDelayPayload {
  poId: string;
  delayHours: number;
}

export interface SupplierCapacityDropPayload {
  supplierId: string;
  productionOrderId: string;
  capacityDropPercent: number;
  newMaxCapacityPerCycle: number;
}

export interface DemandSpikePayload {
  productionOrderId: string;
  usageIncreasePercent: number;
}

export interface SupplierClaimContradictionPayload {
  poId: string;
  supplierId: string;
  productionOrderId: string;
  /** What the supplier claims in their message, e.g. "dispatched, in transit". */
  claimedStatus: string;
  /** What independent tracking actually shows, e.g. "label created, no pickup scanned". */
  trackingStatus: string;
}

async function attachOrCreateCase(store: Store, productionOrderId: string, now: Date): Promise<string> {
  const existing = await store.findCaseByProductionOrder(productionOrderId);
  if (existing) return existing.id;

  const productionOrder = await store.getProductionOrder(productionOrderId);
  if (!productionOrder) throw new Error(`ProductionOrder ${productionOrderId} not found`);

  const created = await store.createCase({
    id: newId("case"),
    productionOrderId,
    status: "EARLY_RISK_CHECK",
    priority: productionOrder.priority,
    riskSignals: [],
    activePlanVersion: 0,
    replanCount: 0,
    continuityImpact: { unitsAtRisk: 0, deadlineBreached: false },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  });
  await store.upsertAgentState({
    caseId: created.id,
    currentStep: "EARLY_RISK_CHECK",
    cycle: 0,
    lastToolCalls: [],
    toolCallCount: 0,
    updatedAt: now.toISOString()
  });
  return created.id;
}

/**
 * PRD §31 event #2 — mutates PurchaseOrder.expectedDeliveryDate and triggers a
 * fresh deadline_risk computation via the next agent tick.
 */
export async function applyShipmentDelayEvent(
  store: Store,
  payload: ShipmentDelayPayload,
  now: Date = new Date()
): Promise<{ caseId: string }> {
  const po = await store.getPurchaseOrder(payload.poId);
  if (!po) throw new Error(`PurchaseOrder ${payload.poId} not found`);

  const newDeliveryDate = new Date(
    new Date(po.expectedDeliveryDate).getTime() + payload.delayHours * 60 * 60 * 1000
  ).toISOString();
  await store.updatePurchaseOrder(po.id, { expectedDeliveryDate: newDeliveryDate, status: "DELAYED" });

  const productionOrder = await store.findProductionOrderBySku(po.sku);
  if (!productionOrder) throw new Error(`No ProductionOrder found for sku ${po.sku}`);

  const caseId = await attachOrCreateCase(store, productionOrder.id, now);
  await store.updatePurchaseOrder(po.id, { caseId });

  await store.appendAuditEvent({
    id: newId("audit"),
    caseId,
    cycle: 0,
    timestamp: now.toISOString(),
    actor: "SYSTEM",
    type: "STATE_TRANSITION",
    summary: `Judge event SHIPMENT_DELAY: PO ${po.id} delayed ${payload.delayHours}h -> new ETA ${newDeliveryDate}`,
    detail: { poId: po.id, delayHours: payload.delayHours, newDeliveryDate }
  });

  return { caseId };
}

/**
 * PRD §31 event #3 — mutates Supplier.maxCapacityPerCycle and triggers a
 * fresh computation via the next agent tick.
 */
export async function applySupplierCapacityDropEvent(
  store: Store,
  payload: SupplierCapacityDropPayload,
  now: Date = new Date()
): Promise<{ caseId: string }> {
  const supplier = await store.getSupplier(payload.supplierId);
  if (!supplier) throw new Error(`Supplier ${payload.supplierId} not found`);

  const updatedSupplier = await store.updateSupplier(supplier.id, { maxCapacityPerCycle: payload.newMaxCapacityPerCycle });

  const productionOrder = await store.getProductionOrder(payload.productionOrderId);
  if (!productionOrder) throw new Error(`No ProductionOrder found for id ${payload.productionOrderId}`);

  const caseId = await attachOrCreateCase(store, productionOrder.id, now);

  await store.appendAuditEvent({
    id: newId("audit"),
    caseId,
    cycle: 0,
    timestamp: now.toISOString(),
    actor: "SYSTEM",
    type: "STATE_TRANSITION",
    summary: `Judge event SUPPLIER_CAPACITY_DROP: Supplier ${supplier.id} capacity dropped by ${payload.capacityDropPercent}% -> new max ${payload.newMaxCapacityPerCycle}`,
    detail: { supplierId: supplier.id, capacityDropPercent: payload.capacityDropPercent, newMaxCapacityPerCycle: payload.newMaxCapacityPerCycle }
  });

  return { caseId };
}

/**
 * Demand Spike — mutates InventoryRecord.dailyUsageRate (the mechanism this
 * codebase's own tests already model, tests/integration/multiEvent.test.ts:
 * "spike dailyUsageRate by +30%"). This drops coverageDays and is picked up by
 * the next EARLY_RISK_CHECK's already-real evaluateEarlyRiskSignals call — no
 * FSM/PLAN logic changes needed since coverage math already reads dailyUsageRate
 * live off the Store on every cycle.
 */
export async function applyDemandSpikeEvent(
  store: Store,
  payload: DemandSpikePayload,
  now: Date = new Date()
): Promise<{ caseId: string }> {
  const productionOrder = await store.getProductionOrder(payload.productionOrderId);
  if (!productionOrder) throw new Error(`ProductionOrder ${payload.productionOrderId} not found`);

  const inventory = await store.getInventoryRecordBySku(productionOrder.sku);
  if (!inventory) throw new Error(`InventoryRecord for sku ${productionOrder.sku} not found`);

  const newDailyUsageRate = inventory.dailyUsageRate * (1 + payload.usageIncreasePercent / 100);
  await store.updateInventoryRecordBySku(productionOrder.sku, { dailyUsageRate: newDailyUsageRate });

  const caseId = await attachOrCreateCase(store, payload.productionOrderId, now);

  await store.appendAuditEvent({
    id: newId("audit"),
    caseId,
    cycle: 0,
    timestamp: now.toISOString(),
    actor: "SYSTEM",
    type: "STATE_TRANSITION",
    summary: `Judge event DEMAND_SPIKE: ${productionOrder.sku} daily usage rate up ${payload.usageIncreasePercent}% -> ${newDailyUsageRate.toFixed(1)}/day`,
    detail: { sku: productionOrder.sku, usageIncreasePercent: payload.usageIncreasePercent, previousDailyUsageRate: inventory.dailyUsageRate, newDailyUsageRate }
  });

  return { caseId };
}

/**
 * Supplier Claim Contradiction — the supplier's own inbound message ("dispatched")
 * is recorded verbatim (a real SupplierMessage row) alongside what independent
 * tracking actually shows, and the supplier is flagged via the real
 * Supplier.hasOpenContradiction field that shared/supplier/eligibility.ts's
 * supplierEligibilityCheck already gates on (shared/agent/fsm.ts's PLAN handler
 * reads this field for real — see the fix there). The next PLAN cycle excludes
 * this supplier and the audit trail records exactly why (PS Scenario 3 / §4.5).
 */
export async function applySupplierClaimContradictionEvent(
  store: Store,
  payload: SupplierClaimContradictionPayload,
  now: Date = new Date()
): Promise<{ caseId: string }> {
  const supplier = await store.getSupplier(payload.supplierId);
  if (!supplier) throw new Error(`Supplier ${payload.supplierId} not found`);
  const po = await store.getPurchaseOrder(payload.poId);
  if (!po) throw new Error(`PurchaseOrder ${payload.poId} not found`);

  const caseId = await attachOrCreateCase(store, payload.productionOrderId, now);

  const inboundMessage: SupplierMessage = {
    id: newId("msg"),
    supplierId: supplier.id,
    caseId,
    direction: "INBOUND",
    subject: `RE: PO ${po.id} status`,
    body: `PO ${po.id} has been ${payload.claimedStatus}.`,
    extractedFields: { claimedStatus: payload.claimedStatus },
    contradictionFlag: true,
    sentAt: now.toISOString()
  };
  await store.createSupplierMessage(inboundMessage);
  await store.updateSupplier(supplier.id, { hasOpenContradiction: true });

  await store.appendAuditEvent({
    id: newId("audit"),
    caseId,
    cycle: 0,
    timestamp: now.toISOString(),
    actor: "SYSTEM",
    type: "STATE_TRANSITION",
    summary: `Judge event SUPPLIER_CLAIM_CONTRADICTION: ${supplier.name} claims PO ${po.id} is "${payload.claimedStatus}", but tracking shows "${payload.trackingStatus}" -> flagging supplier, excluding from next recovery plan`,
    detail: {
      supplierId: supplier.id,
      poId: po.id,
      claimedStatus: payload.claimedStatus,
      trackingStatus: payload.trackingStatus
    }
  });

  return { caseId };
}
