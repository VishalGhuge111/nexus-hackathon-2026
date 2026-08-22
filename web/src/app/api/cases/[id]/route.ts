// PRD §27 — GET /api/cases/:id: full Case + latest AgentState + active
// RecoveryPlanVersion + AuditEvents. This is the single source Mission Control
// renders from (§25) — nothing shown in the UI exists without a corresponding
// AuditEvent.
import { getStore } from "@nexus/shared/db/factory";
import { coverageDays, productionRequirement } from "@nexus/shared/calculations";
import type { ProductionOrder } from "@nexus/shared/types/production";
import type { InventoryRecord } from "@nexus/shared/types/inventory";
import type { PurchaseOrder } from "@nexus/shared/types/procurement";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const store = getStore();

  const caseRecord = await store.getCase(id);
  if (!caseRecord) {
    return Response.json({ error: `Case ${id} not found` }, { status: 404 });
  }

  const [agentState, activePlanVersion, auditEvents, pendingApproval, purchaseOrders] = await Promise.all([
    store.getAgentState(id),
    store.getActivePlanVersion(id),
    store.listAuditEvents(id),
    store.getPendingApprovalForCase(id),
    store.listPurchaseOrdersByCase(id)
  ]);
  const latestValidationResult = activePlanVersion
    ? await store.getLatestValidationResult(activePlanVersion.id)
    : null;

  const productionOrder = await store.getProductionOrder(caseRecord.productionOrderId);
  const inventory = productionOrder ? await store.getInventoryRecordBySku(productionOrder.sku) : null;
  const doNothingVsNexus = buildComparison(productionOrder, inventory, purchaseOrders);

  return Response.json({
    case: caseRecord,
    agentState,
    activePlanVersion,
    latestValidationResult,
    pendingApproval,
    purchaseOrders,
    productionOrder,
    inventory,
    doNothingVsNexus,
    auditEvents
  });
}

// PRD §30 — Do-Nothing vs NEXUS Plan, both computed by the same deterministic
// formulas under two scenarios. Recovery allocations are always created with
// status 'SENT' by erp_update (shared/tools/primitives.ts), so that field alone
// distinguishes "what already existed" from "what NEXUS added" — no
// scenario-specific knowledge required here.
function buildComparison(
  productionOrder: ProductionOrder | null,
  inventory: InventoryRecord | null,
  purchaseOrders: PurchaseOrder[]
) {
  if (!productionOrder || !inventory) return null;

  const requirementResult = productionRequirement({
    plannedQty: productionOrder.plannedQty,
    bomQtyPerUnit: productionOrder.bomQtyPerUnit
  });
  const requiredQty = requirementResult.status === "OK" ? requirementResult.value : 0;
  const deadline = new Date(productionOrder.deadlineDate).getTime();
  const coverage = coverageDays({
    usableStock: inventory.usableStock,
    dailyUsageRate: inventory.dailyUsageRate
  }).coverageDays;

  function scenario(pos: typeof purchaseOrders) {
    const onTimeQty = pos
      .filter((po) => new Date(po.expectedDeliveryDate).getTime() <= deadline)
      .reduce((sum, po) => sum + po.qty, 0);
    const totalAvailable = inventory!.usableStock + onTimeQty;
    return {
      coverageDays: Number.isFinite(coverage) ? coverage : null,
      deadlineBreached: totalAvailable < requiredQty,
      unitsAtRisk: Math.max(0, requiredQty - totalAvailable)
    };
  }

  const recoveryPOs = purchaseOrders.filter((po) => po.status === "SENT");
  const originalPOs = purchaseOrders.filter((po) => po.status !== "SENT");
  const costImpact = recoveryPOs.reduce((sum, po) => sum + po.qty * po.unitPrice, 0);

  return {
    doNothing: { ...scenario(originalPOs), costImpact: 0 },
    nexusPlan: { ...scenario(purchaseOrders), costImpact }
  };
}
