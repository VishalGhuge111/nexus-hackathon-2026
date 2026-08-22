// GET /api/audit — every real AuditEvent across all cases (PRD §25: "nothing
// shown in the UI is allowed to exist without a corresponding AuditEvent"),
// most recent first, for the global Audit page. Per-case audit already exists
// via GET /api/cases/:id; this is the cross-case view.
import { getStore } from "@nexus/shared/db/factory";

export async function GET(): Promise<Response> {
  const store = getStore();
  const events = await store.listAllAuditEvents();
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return Response.json({ auditEvents: sorted });
}
