// PRD §14 — concrete tool executors. Each is a thin, typed wrapper over the Store,
// returning the locked SUCCESS/FAILURE/NO_DATA contract. No tool ever mutates state
// through any path other than these functions, and no tool call is ever treated as
// ground truth beyond exactly what it returns (§15).
import type { Store } from "../db/types";
import type { ToolResult } from "../types/tools";
import type { InventoryRecord } from "../types/inventory";
import type { ProductionOrder } from "../types/production";
import type { PurchaseOrder, RFQ, RfqResponse } from "../types/procurement";
import type { ApprovalRequest } from "../types/validation";
import type { SupplierMessage } from "../types/supplier";
import { DEFAULT_APPROVAL_THRESHOLD } from "../config";
import { newId } from "../util/id";
import { sendTransactionalEmail, type EmailDeliveryStatus } from "../email/brevoClient";

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

export async function rfqRequestTool(
  store: Store,
  params: { caseId: string; sku: string; qty: number; neededBy: string; supplierIds: string[] }
): Promise<ToolResult<RFQ>> {
  try {
    const rfq: RFQ = {
      id: newId("rfq"),
      caseId: params.caseId,
      sku: params.sku,
      qty: params.qty,
      neededBy: params.neededBy,
      supplierIds: params.supplierIds,
      status: "CLOSED", // Auto-generating responses for simulation
      responses: []
    };

    for (const supplierId of params.supplierIds) {
      const supplier = await store.getSupplier(supplierId);
      if (!supplier) continue;
      
      const price = supplier.pricePerUnit[params.sku] ?? Number.POSITIVE_INFINITY;
      const capacityOffered = Math.min(params.qty, supplier.maxCapacityPerCycle);
      
      const response: RfqResponse = {
        supplierId,
        price,
        leadTimeDays: supplier.defaultLeadTimeDays,
        capacityOffered,
        expediteAvailable: true,
        expediteFee: price * 0.2, // 20% premium logic
        quoteValidHours: 24,
        quoteReceivedAt: new Date().toISOString()
      };
      rfq.responses.push(response);
    }

    await store.createRfq(rfq);

    return {
      toolName: "rfq_request",
      status: "SUCCESS",
      data: rfq,
      latencyMs: 0
    };
  } catch (err) {
    return {
      toolName: "rfq_request",
      status: "FAILURE",
      errorReason: err instanceof Error ? err.message : String(err),
      latencyMs: 0
    };
  }
}

export interface SupplierMessageSendOutcome {
  supplierId: string;
  messageId: string;
  emailStatus: EmailDeliveryStatus;
  emailError?: string;
  providerMessageId?: string;
  /** Actual delivery target — the override address when SUPPLIER_EMAIL_OVERRIDE is set, otherwise the supplier's own contactEmail. */
  to?: string;
  /** The supplier's real address on file, independent of any override — always preserved so the record shows who NEXUS actually meant to contact. */
  intendedRecipient?: string;
  overrideUsed: boolean;
}

/**
 * PS §5.5/5.6 — sends one real email per supplier via Brevo (falling back to
 * "recorded only" when unconfigured or the supplier has no contactEmail on
 * file) and always records a SupplierMessage regardless of email outcome.
 * One dispatchTool call handles the whole supplier list (mirrors
 * rfqRequestTool's internal loop over supplierIds) so a case with several
 * eligible suppliers still only spends a single tool-call-budget unit here.
 * Email delivery is never allowed to throw — a provider outage degrades to
 * emailStatus: 'FAILED' on that one outcome, not a failed tool call.
 */
export async function supplierMessageSendTool(
  store: Store,
  params: {
    caseId: string;
    messages: { supplierId: string; subject: string; body: string; communicationType?: string }[];
  }
): Promise<ToolResult<SupplierMessageSendOutcome[]>> {
  try {
    const outcomes: SupplierMessageSendOutcome[] = [];

    for (const m of params.messages) {
      const supplier = await store.getSupplier(m.supplierId);
      const intendedRecipient = supplier?.contactEmail;
      const override = process.env.SUPPLIER_EMAIL_OVERRIDE;
      const to = override || intendedRecipient;
      const overrideUsed = Boolean(override);

      const emailResult = to
        ? await sendTransactionalEmail({
            to,
            toName: supplier?.name,
            subject: m.subject,
            htmlBody: m.body.replace(/\n/g, "<br/>")
          })
        : { status: "NOT_CONFIGURED" as const, errorReason: "No contact email on file for this supplier" };

      const message: SupplierMessage = {
        id: newId("msg"),
        supplierId: m.supplierId,
        caseId: params.caseId,
        direction: "OUTBOUND",
        subject: m.subject,
        body: m.body,
        extractedFields: {
          communicationType: m.communicationType ?? "RFQ_REQUEST",
          emailStatus: emailResult.status,
          emailError: emailResult.errorReason,
          providerMessageId: emailResult.providerMessageId,
          to: to ?? null,
          intendedRecipient: intendedRecipient ?? null,
          overrideUsed
        },
        sentAt: new Date().toISOString()
      };
      await store.createSupplierMessage(message);

      outcomes.push({
        supplierId: m.supplierId,
        messageId: message.id,
        emailStatus: emailResult.status,
        emailError: emailResult.errorReason,
        providerMessageId: emailResult.providerMessageId,
        to,
        intendedRecipient,
        overrideUsed
      });
    }

    return { toolName: "supplier_message_send", status: "SUCCESS", data: outcomes, latencyMs: 0 };
  } catch (err) {
    return {
      toolName: "supplier_message_send",
      status: "FAILURE",
      errorReason: err instanceof Error ? err.message : String(err),
      latencyMs: 0
    };
  }
}

export async function supplierMessageReceiveTool(
  store: Store,
  params: { supplierIds: string[]; caseId: string }
): Promise<ToolResult<SupplierMessage[]>> {
  const messages = await store.listSupplierMessagesByCase(params.caseId);
  const inbound = messages.filter((m) => params.supplierIds.includes(m.supplierId) && m.direction === "INBOUND");

  if (inbound.length === 0) {
    return {
      toolName: "supplier_message_receive",
      status: "NO_DATA",
      latencyMs: 0
    };
  }

  return {
    toolName: "supplier_message_receive",
    status: "SUCCESS",
    data: inbound,
    latencyMs: 0
  };
}

/**
 * PS §5.5 — represents a supplier's quote reply as an inbound message in the
 * same communication thread, deriving every field from the RfqResponse the
 * (existing, real) RFQ engine already produced. This does not duplicate
 * supplier data; it re-presents it as a message, the same pattern
 * shared/agent/events.ts already uses for the SUPPLIER_CLAIM_CONTRADICTION
 * inbound message.
 */
export function buildQuoteInboundMessage(params: {
  caseId: string;
  sku: string;
  response: RfqResponse;
}): SupplierMessage {
  const { caseId, sku, response } = params;
  const expediteNote = response.expediteAvailable
    ? ` Expedited delivery available for an additional fee of ₹${response.expediteFee}/unit.`
    : "";
  return {
    id: newId("msg"),
    supplierId: response.supplierId,
    caseId,
    direction: "INBOUND",
    subject: `RE: Urgent RFQ — ${sku} Recovery Requirement`,
    body:
      `We can supply ${response.capacityOffered} units of ${sku} at ₹${response.price}/unit, ` +
      `with a ${response.leadTimeDays}-day lead time. Quote valid for ${response.quoteValidHours} hours.` +
      expediteNote,
    extractedFields: { communicationType: "QUOTE_RESPONSE", ...response },
    sentAt: response.quoteReceivedAt
  };
}
