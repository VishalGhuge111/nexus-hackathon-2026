// PRD §27 — POST /api/agent/event: judge-triggered disruption injector.
// Creates/attaches a Case and immediately runs one tick (§31).
import { getStore } from "@nexus/shared/db/factory";
import { getLlmClient } from "@nexus/shared/llm/factory";
import {
  applyShipmentDelayEvent,
  applySupplierCapacityDropEvent,
  applyDemandSpikeEvent,
  applySupplierClaimContradictionEvent
} from "@nexus/shared/agent/events";
import { runAgentTick } from "@nexus/shared/agent/fsm";

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("type" in body)) {
    return Response.json({ error: "Body must include a disruption event type" }, { status: 400 });
  }

  const store = getStore();
  const llm = getLlmClient();

  try {
    if (body.type === "SHIPMENT_DELAY") {
      const payload = (body as { payload?: { poId?: string; delayHours?: number } }).payload;
      if (!payload?.poId) {
        return Response.json({ error: "payload.poId is required for SHIPMENT_DELAY" }, { status: 400 });
      }
      const { caseId } = await applyShipmentDelayEvent(store, {
        poId: payload.poId,
        delayHours: payload.delayHours ?? 24
      });
      const { case: updated } = await runAgentTick({ store, llm }, caseId);
      return Response.json({ caseId, case: updated });
    }

    if (body.type === "SUPPLIER_CAPACITY_DROP") {
      const payload = (
        body as {
          payload?: { supplierId?: string; productionOrderId?: string; capacityDropPercent?: number; newMaxCapacityPerCycle?: number };
        }
      ).payload;
      if (!payload?.supplierId || !payload?.productionOrderId || payload?.newMaxCapacityPerCycle === undefined) {
        return Response.json(
          { error: "payload.supplierId, payload.productionOrderId, and payload.newMaxCapacityPerCycle are required for SUPPLIER_CAPACITY_DROP" },
          { status: 400 }
        );
      }
      const { caseId } = await applySupplierCapacityDropEvent(store, {
        supplierId: payload.supplierId,
        productionOrderId: payload.productionOrderId,
        capacityDropPercent: payload.capacityDropPercent ?? 50,
        newMaxCapacityPerCycle: payload.newMaxCapacityPerCycle
      });
      const { case: updated } = await runAgentTick({ store, llm }, caseId);
      return Response.json({ caseId, case: updated });
    }

    if (body.type === "DEMAND_SPIKE") {
      const payload = (body as { payload?: { productionOrderId?: string; usageIncreasePercent?: number } }).payload;
      if (!payload?.productionOrderId) {
        return Response.json({ error: "payload.productionOrderId is required for DEMAND_SPIKE" }, { status: 400 });
      }
      const { caseId } = await applyDemandSpikeEvent(store, {
        productionOrderId: payload.productionOrderId,
        usageIncreasePercent: payload.usageIncreasePercent ?? 30
      });
      const { case: updated } = await runAgentTick({ store, llm }, caseId);
      return Response.json({ caseId, case: updated });
    }

    if (body.type === "SUPPLIER_CLAIM_CONTRADICTION") {
      const payload = (
        body as {
          payload?: { poId?: string; supplierId?: string; productionOrderId?: string; claimedStatus?: string; trackingStatus?: string };
        }
      ).payload;
      if (!payload?.poId || !payload?.supplierId || !payload?.productionOrderId) {
        return Response.json(
          { error: "payload.poId, payload.supplierId, and payload.productionOrderId are required for SUPPLIER_CLAIM_CONTRADICTION" },
          { status: 400 }
        );
      }
      const { caseId } = await applySupplierClaimContradictionEvent(store, {
        poId: payload.poId,
        supplierId: payload.supplierId,
        productionOrderId: payload.productionOrderId,
        claimedStatus: payload.claimedStatus ?? "dispatched, in transit",
        trackingStatus: payload.trackingStatus ?? "label created, no carrier pickup scanned"
      });
      const { case: updated } = await runAgentTick({ store, llm }, caseId);
      return Response.json({ caseId, case: updated });
    }

    return Response.json(
      { error: `Event type ${body.type} is not yet implemented in this vertical slice` },
      { status: 501 }
    );
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
