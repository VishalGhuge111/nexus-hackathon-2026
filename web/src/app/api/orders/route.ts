// GET /api/orders — every real PurchaseOrder across all cases (shared/types/procurement.ts).
// Backs both the Orders and Shipments pages: the domain model has one entity for
// both concerns (a PurchaseOrder carries supplier, qty, unitPrice, status,
// expectedDeliveryDate, and an optional caseId when it's a recovery allocation) —
// there is no separate "shipment" record, so this endpoint is the single source
// for both views rather than duplicating a route around the same Store call.
import { getStore } from "@nexus/shared/db/factory";

export async function GET(): Promise<Response> {
  const store = getStore();
  const purchaseOrders = await store.listAllPurchaseOrders();
  return Response.json({ purchaseOrders });
}
