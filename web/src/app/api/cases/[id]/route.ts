// PRD §27 — GET /api/cases/:id: full Case + latest AgentState + active
// RecoveryPlanVersion + AuditEvents. This is the single source Mission Control
// renders from (§25) — nothing shown in the UI exists without a corresponding
// AuditEvent.
import { getStore } from "@nexus/shared/db/factory";
import { coverageDays, productionRequirement } from "@nexus/shared/calculations";
import { supplierEligibilityCheck } from "@nexus/shared/supplier/eligibility";
import { REQUIRED_CERTIFICATIONS } from "@nexus/shared/agent/fsm";
import { DEFAULT_MIN_QUALITY_FOR_CASE } from "@nexus/shared/config";
import type { ProductionOrder } from "@nexus/shared/types/production";
import type { InventoryRecord } from "@nexus/shared/types/inventory";
import type { PurchaseOrder } from "@nexus/shared/types/procurement";
import type { Supplier } from "@nexus/shared/types/supplier";
import type { Store } from "@nexus/shared/db/types";

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

  const [agentState, activePlanVersion, planVersions, auditEvents, pendingApproval, purchaseOrders] = await Promise.all([
    store.getAgentState(id),
    store.getActivePlanVersion(id),
    store.listPlanVersions(id),
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
  const [rfqs, supplierEligibility] = await Promise.all([
    store.listRfqsByCase(id),
    buildSupplierEligibility(store, productionOrder, inventory, purchaseOrders)
  ]);
  const disruptedSupplierId = purchaseOrders.find((po) => po.status !== "SENT")?.supplierId ?? null;

  return Response.json({
    case: caseRecord,
    agentState,
    activePlanVersion,
    planVersions,
    latestValidationResult,
    pendingApproval,
    purchaseOrders,
    productionOrder,
    inventory,
    doNothingVsNexus,
    auditEvents,
    rfqs,
    supplierEligibility,
    disruptedSupplierId
  });
}

// PRD §17 — same real supplierEligibilityCheck the FSM's PLAN handler runs,
// evaluated here read-only against the case's current shortage so the UI can
// show the judge the full roster (including WHY an ineligible supplier was
// rejected), not just the allocations that made it into the chosen plan.
async function buildSupplierEligibility(
  store: Store,
  productionOrder: ProductionOrder | null,
  inventory: InventoryRecord | null,
  purchaseOrders: PurchaseOrder[]
): Promise<{ supplier: Supplier; result: { eligible: boolean; reasons: string[] } }[]> {
  if (!productionOrder || !inventory) return [];

  const requirementResult = productionRequirement({
    plannedQty: productionOrder.plannedQty,
    bomQtyPerUnit: productionOrder.bomQtyPerUnit
  });
  const requiredQtyTotal = requirementResult.status === "OK" ? requirementResult.value : 0;
  const deadlineDate = new Date(productionOrder.deadlineDate);
  const onTimeQty = purchaseOrders
    .filter((po) => new Date(po.expectedDeliveryDate).getTime() <= deadlineDate.getTime())
    .reduce((sum, po) => sum + po.qty, 0);
  const shortageQty = Math.max(0, requiredQtyTotal - inventory.usableStock - onTimeQty);
  const daysUntilDeadline = (deadlineDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);

  const suppliers = await store.listSuppliers();
  return suppliers.map((supplier) => ({
    supplier,
    result: supplierEligibilityCheck(
      {
        supplierId: supplier.id,
        certifications: supplier.certifications,
        moq: supplier.moq,
        maxCapacityPerCycle: supplier.maxCapacityPerCycle,
        reliabilityScore: supplier.reliabilityScore,
        qualityScore: supplier.qualityScore,
        leadTimeDays: supplier.defaultLeadTimeDays,
        hasOpenContradiction: supplier.hasOpenContradiction ?? false
      },
      {
        requiredCertifications: REQUIRED_CERTIFICATIONS,
        qty: shortageQty,
        today: new Date(),
        neededBy: deadlineDate,
        deadlineSlackDays: daysUntilDeadline,
        minQualityForCase: DEFAULT_MIN_QUALITY_FOR_CASE
      }
    )
  }));
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
