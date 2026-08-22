// PRD §27 — POST /api/approvals/:id/resolve: human approve/reject.
// Writes ApprovalRequest + AuditEvent(actor: HUMAN). Auth note (§27/§35): in the
// full system this route is gated to the OPS_CONTROLLER Firebase role; Firebase
// Authentication is not wired in this vertical slice (see final report).
import { getStore } from "@nexus/shared/db/factory";
import { resolveApproval } from "@nexus/shared/agent/approvals";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || (body.decision !== "APPROVED" && body.decision !== "REJECTED")) {
    return Response.json({ error: "body.decision must be APPROVED or REJECTED" }, { status: 400 });
  }
  const resolvedBy = typeof body.resolvedBy === "string" ? body.resolvedBy : "ops-controller";

  const store = getStore();
  try {
    const { case: updated } = await resolveApproval(store, id, body.decision, resolvedBy);
    return Response.json({ case: updated });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
