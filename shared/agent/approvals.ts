// PRD §21 / §24 — human resolution of an ApprovalRequest. APPROVED returns to the
// controlled execution path; REJECTED routes to ADAPT_REPLAN (if a replan is still
// viable) or NO_FEASIBLE_RECOVERY. Resolution itself is an audited HUMAN action.
import type { Store } from "../db/types";
import type { Case } from "../types/case";
import type { AgentState } from "../types/agent";
import { newId } from "../util/id";
import { transition, executeApprovedPlan } from "./fsm";

export async function resolveApproval(
  store: Store,
  approvalRequestId: string,
  decision: "APPROVED" | "REJECTED",
  resolvedBy: string,
  now: Date = new Date()
): Promise<{ case: Case; agentState: AgentState }> {
  const request = await store.getApprovalRequest(approvalRequestId);
  if (!request) throw new Error(`ApprovalRequest ${approvalRequestId} not found`);
  if (request.status !== "PENDING") {
    throw new Error(`ApprovalRequest ${approvalRequestId} already resolved as ${request.status}`);
  }

  await store.updateApprovalRequest(approvalRequestId, {
    status: decision,
    resolvedBy,
    resolvedAt: now.toISOString()
  });
  await store.appendAuditEvent({
    id: newId("audit"),
    caseId: request.caseId,
    cycle: 0,
    timestamp: now.toISOString(),
    actor: "HUMAN",
    type: "HUMAN_ACTION",
    summary: `Approval ${decision} by ${resolvedBy}`,
    detail: { approvalRequestId, decision, resolvedBy }
  });

  const caseRecord = await store.getCase(request.caseId);
  if (!caseRecord) throw new Error(`Case ${request.caseId} not found`);
  const agentState = await store.getAgentState(request.caseId);
  if (!agentState) throw new Error(`AgentState for case ${request.caseId} not found`);
  const planVersion = await store.getActivePlanVersion(request.caseId);

  const budget = await store.getEmergencyBudget();
  if (planVersion) {
    await store.updateEmergencyBudget({
      reservedAmount: Math.max(0, budget.reservedAmount - planVersion.plan.totalCost)
    });
  }

  if (decision === "APPROVED") {
    if (!planVersion) throw new Error(`No active plan version to execute for case ${request.caseId}`);
    return executeApprovedPlan({ store }, caseRecord, agentState, planVersion.plan, now);
  }

  // Route through ADAPT_REPLAN either way; its own handler (shared/agent/fsm.ts)
  // is the single place that enforces MAX_REPLANS, so the cap is never checked twice.
  agentState.pendingLlmTask = "human rejected the escalated plan";
  return transition(store, caseRecord, agentState, "ADAPT_REPLAN", "human rejected the escalated plan; replanning");
}
