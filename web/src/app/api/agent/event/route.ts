// PRD §27 — POST /api/agent/event: judge-triggered disruption injector.
// Creates/attaches a Case and immediately runs one tick (§31).
import { getStore } from "@nexus/shared/db/factory";
import { getLlmClient } from "@nexus/shared/llm/factory";
import { applyShipmentDelayEvent } from "@nexus/shared/agent/events";
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

    return Response.json(
      { error: `Event type ${body.type} is not yet implemented in this vertical slice` },
      { status: 501 }
    );
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
