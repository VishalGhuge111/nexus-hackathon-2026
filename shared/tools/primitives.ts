// PRD §14 — concrete tool executors. Each is a thin, typed wrapper over the Store,
// returning the locked SUCCESS/FAILURE/NO_DATA contract. No tool ever mutates state
// through any path other than these functions, and no tool call is ever treated as
// ground truth beyond exactly what it returns (§15).
import type { Store } from "../db/types";
import type { ToolResult } from "../types/tools";
import type { InventoryRecord } from "../types/inventory";
import type { ProductionOrder } from "../types/production";
import type { PurchaseOrder } from "../types/procurement";
import type { ApprovalRequest } from "../types/validation";
import { DEFAULT_APPROVAL_THRESHOLD } from "../config";
import { newId } from "../util/id";

export async function inventoryLookup(
  store: Store,
  sku: string
): Promise<ToolResult<InventoryRecord>> {
  const record = await store.getInventoryRecordBySku(sku);
  if (!record) return { toolName: "inventory_lookup", status: "NO_DATA", latencyMs: 0 };
  return { toolName: "inventory_lookup", status: "SUCCESS", data: record, latencyMs: 0 };
}

export async function purchaseOrderLookup(
  store: Store,
  poId: string
): Promise<ToolResult<PurchaseOrder>> {
  const po = await store.getPurchaseOrder(poId);
  if (!po) return { toolName: "purchase_order_lookup", status: "NO_DATA", latencyMs: 0 };
  return { toolName: "purchase_order_lookup", status: "SUCCESS", data: po, latencyMs: 0 };
}

export async function productionScheduleLookup(
  store: Store,
  productionOrderId: string
): Promise<ToolResult<ProductionOrder>> {
  const order = await store.getProductionOrder(productionOrderId);
  if (!order) return { toolName: "production_schedule_lookup", status: "NO_DATA", latencyMs: 0 };
  return { toolName: "production_schedule_lookup", status: "SUCCESS", data: order, latencyMs: 0 };
}

export interface ShipmentTrackingResult {
  lastEvent: string;
  lastEventAt: string;
  status: string;
}

export async function shipmentTrackingLookup(
  store: Store,
  poId: string
): Promise<ToolResult<ShipmentTrackingResult>> {
  const po = await store.getPurchaseOrder(poId);
  if (!po) return { toolName: "shipment_tracking_lookup", status: "NO_DATA", latencyMs: 0 };
  return {
    toolName: "shipment_tracking_lookup",
    status: "SUCCESS",
    data: { lastEvent: po.status, lastEventAt: po.expectedDeliveryDate, status: po.status },
    latencyMs: 0
  };
}

export interface ApprovalCheckResult {
  approvalRequired: boolean;
  approvalReason: string;
}

/**
 * PRD §21 — the sandbox-authoritative check is on absolute estimated cost.
 * Our locked schema (§26) has no `approval_required_above` field on PurchaseOrder,
 * so per §21's own fallback rule this always uses the configured session default.
 */
export async function approvalCheckTool(
  store: Store,
  estimatedCost: number,
  policyFlagged: boolean
): Promise<ToolResult<ApprovalCheckResult>> {
  const budget = await store.getEmergencyBudget();
  const overThreshold = estimatedCost > DEFAULT_APPROVAL_THRESHOLD;
  const overBudget = estimatedCost > budget.remainingAmount;
  const approvalRequired = overThreshold || overBudget || policyFlagged;

  let approvalReason = "Within threshold and budget; no approval required.";
  if (overThreshold) approvalReason = "Total cost requires manager approval.";
  else if (overBudget) approvalReason = "Total cost exceeds remaining emergency budget.";
  else if (policyFlagged) approvalReason = "Policy flag: new/unvetted supplier or CRITICAL priority order.";

  return {
    toolName: "approval_check",
    status: "SUCCESS",
    data: { approvalRequired, approvalReason },
    latencyMs: 0
  };
}

export interface ErpUpdateAllocation {
  supplierId: string;
  qty: number;
  unitPrice: number;
  expediteFee?: number;
  expectedDeliveryDate: string;
}

export interface ErpUpdateResult {
  applied: boolean;
  createdPurchaseOrderIds: string[];
}

export async function erpUpdateTool(
  store: Store,
  params: { caseId: string; sku: string; allocations: ErpUpdateAllocation[]; totalCost: number }
): Promise<ToolResult<ErpUpdateResult>> {
  try {
    const createdPurchaseOrderIds: string[] = [];
    for (const allocation of params.allocations) {
      const po = await store.createPurchaseOrder({
        id: newId("po"),
        supplierId: allocation.supplierId,
        sku: params.sku,
        qty: allocation.qty,
        unitPrice: allocation.unitPrice,
        status: "SENT",
        expectedDeliveryDate: allocation.expectedDeliveryDate,
        caseId: params.caseId
      });
      createdPurchaseOrderIds.push(po.id);
    }
    const budget = await store.getEmergencyBudget();
    await store.updateEmergencyBudget({ spentAmount: budget.spentAmount + params.totalCost });
    return {
      toolName: "erp_update",
      status: "SUCCESS",
      data: { applied: true, createdPurchaseOrderIds },
      latencyMs: 0
    };
  } catch (err) {
    return {
      toolName: "erp_update",
      status: "FAILURE",
      errorReason: err instanceof Error ? err.message : String(err),
      latencyMs: 0
    };
  }
}

export async function escalationCreateTool(
  store: Store,
  params: { caseId: string; planVersionId: string; brief: string }
): Promise<ToolResult<ApprovalRequest>> {
  const req = await store.createApprovalRequest({
    id: newId("appr"),
    caseId: params.caseId,
    planVersionId: params.planVersionId,
    brief: params.brief,
    status: "PENDING"
  });
  return { toolName: "escalation_create", status: "SUCCESS", data: req, latencyMs: 0 };
}

export interface OutcomeRereadResult {
  inventory: InventoryRecord;
  production: ProductionOrder;
  purchaseOrders: PurchaseOrder[];
}

export async function outcomeRerereadTool(
  store: Store,
  params: { sku: string; productionOrderId: string; caseId: string }
): Promise<ToolResult<OutcomeRereadResult>> {
  const inventory = await store.getInventoryRecordBySku(params.sku);
  const production = await store.getProductionOrder(params.productionOrderId);
  if (!inventory || !production) {
    return { toolName: "outcome_reread", status: "NO_DATA", latencyMs: 0 };
  }
  const purchaseOrders = await store.listPurchaseOrdersByCase(params.caseId);
  return {
    toolName: "outcome_reread",
    status: "SUCCESS",
    data: { inventory, production, purchaseOrders },
    latencyMs: 0
  };
}
