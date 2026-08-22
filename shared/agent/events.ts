// PRD §31 — judge-selectable live events. Each mutates real simulated ground truth
// and is followed by an immediate agent tick (done by the caller, e.g. the
// /api/agent/event route), not a wait for the next cron cycle.
import type { Store } from "../db/types";
import { newId } from "../util/id";

export type DisruptionEventType = "SHIPMENT_DELAY" | "SUPPLIER_CAPACITY_DROP" | "DEMAND_SPIKE";

export interface ShipmentDelayPayload {
  poId: string;
  delayHours: number;
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
