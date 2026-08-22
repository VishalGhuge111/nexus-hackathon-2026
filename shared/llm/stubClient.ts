// Local test double for LlmClient — used when ANTHROPIC_API_KEY is not configured,
// so the full agent loop (including PLAN) is runnable offline. Deterministic on
// purpose: it exists to prove the FSM/Validator loop, not to demonstrate LLM
// creativity. Every output is clearly labeled "[local test double]" so it can never
// be mistaken for a real Claude response (PRD §45: "must not be faked").
import type { LlmClient, PlanProposalRequest, ProposedPlan, EscalationBriefRequest, ProposedAllocation } from "./types";

export class StubLlmClient implements LlmClient {
  async proposeRecoveryPlan(req: PlanProposalRequest): Promise<ProposedPlan> {
    const sorted = [...req.eligibleSuppliers].sort((a, b) => a.pricePerUnit - b.pricePerUnit);

    const single = sorted.find(
      (s) => s.maxCapacityPerCycle >= req.shortageQty && req.shortageQty >= s.moq
    );
    if (single) {
      return {
        allocations: [{ supplierId: single.supplierId, qty: req.shortageQty }],
        rationale: `[local test double] Single-supplier reroute to ${single.name}: lowest price among eligible suppliers able to fully cover the ${req.shortageQty}-unit shortage before the deadline.`
      };
    }

    let remaining = req.shortageQty;
    const allocations: ProposedAllocation[] = [];
    for (const supplier of sorted) {
      if (remaining <= 0) break;
      const qty = Math.min(supplier.maxCapacityPerCycle, remaining);
      if (qty < supplier.moq) continue;
      allocations.push({ supplierId: supplier.supplierId, qty });
      remaining -= qty;
    }
    return {
      allocations,
      rationale: `[local test double] No single eligible supplier can cover ${req.shortageQty} units; split across ${allocations.length} suppliers by lowest price first.`
    };
  }

  async draftEscalationBrief(req: EscalationBriefRequest): Promise<string> {
    return (
      `[local test double] Case ${req.caseId} requires human approval. ` +
      `${req.approvalReason} Plan: ${req.planSummary}. Validator: ${req.validationSummary}.`
    );
  }
}
