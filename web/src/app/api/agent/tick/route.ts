// PRD §27 — POST /api/agent/tick: advances all OPEN/in-progress Cases one step.
// Invoked by Vercel Cron in production (see vercel.json); in local/dev runs the
// Mission Control UI polls this endpoint client-side to keep the demo live
// without a running cron.
import { getStore } from "@nexus/shared/db/factory";
import { getLlmClient } from "@nexus/shared/llm/factory";
import { runAgentTick } from "@nexus/shared/agent/fsm";

export async function POST(): Promise<Response> {
  const store = getStore();
  const llm = getLlmClient();

  const activeCases = await store.listActiveCases();
  const advanceable = activeCases.filter(
    (c) => c.status !== "HUMAN_ESCALATED_AWAITING_DECISION" && c.status !== "QUEUED"
  );

  const results = [];
  for (const caseRecord of advanceable) {
    try {
      const { case: updated } = await runAgentTick({ store, llm }, caseRecord.id);
      results.push({ caseId: updated.id, status: updated.status });
    } catch (err) {
      results.push({ caseId: caseRecord.id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return Response.json({ advanced: results.length, results });
}
