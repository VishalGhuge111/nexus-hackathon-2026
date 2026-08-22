// Local test double for LlmClient — used when ANTHROPIC_API_KEY is not configured,
// so the full agent loop (including PLAN) is runnable offline. Deterministic on
// purpose: it exists to prove the FSM/Validator loop, not to demonstrate LLM
// creativity. proposeRecoveryPlan's rationale strings are labeled
// "[local test double]" (audit-trail-only, never rendered to a judge) so this
// output can never be mistaken for a real Claude response if inspected
// directly (PRD §45: "must not be faked"); draftEscalationBrief's judge-facing
// output discloses the same fact at the page level instead — see its own
// comment below.
import type { LlmClient, PlanProposalRequest, ProposedPlan, EscalationBriefRequest, ProposedAllocation } from "./types";

export interface StubLlmClientOptions {
  /**
   * OPT-IN, default false. When true, the first proposal (no rejection
   * feedback yet) deliberately undershoots so a caller can exercise a genuine
   * VALIDATE failure -> ADAPT_REPLAN -> corrected V2 (PRD §23/Figure 3) —
   * e.g. the Mission Control golden-path demo (tests/integration/shipmentDelay.test.ts).
   * Default behavior (false) always proposes a fully-covering first plan, which
   * is what general-purpose FSM tests (tests/state-machine/fsmTransitions.test.ts)
   * and the PRD's own stub-design intent ("prove the FSM/Validator loop, not
   * demonstrate LLM creativity") assume.
   */
  forceInitialUndershoot?: boolean;
}

export class StubLlmClient implements LlmClient {
  private readonly forceInitialUndershoot: boolean;

  constructor(options: StubLlmClientOptions = {}) {
    this.forceInitialUndershoot = options.forceInitialUndershoot ?? false;
  }

  async proposeRecoveryPlan(req: PlanProposalRequest): Promise<ProposedPlan> {
    const sorted = [...req.eligibleSuppliers].sort((a, b) => a.pricePerUnit - b.pricePerUnit);

    // First proposal only (no rejection feedback yet), and only when explicitly
    // opted in: deliberately undershoot so the caller can show a genuine
    // VALIDATE failure -> ADAPT_REPLAN -> corrected V2 (PRD §23/Figure 3),
    // instead of always getting it right first try. Falls through to the
    // full-coverage logic below on any replan attempt, when not opted in, or
    // if undershooting isn't possible without violating MOQ.
    if (this.forceInitialUndershoot && !req.previousPlanRejectionReason) {
      const cheapest = sorted[0];
      const partialQty = cheapest ? Math.floor(req.shortageQty * 0.65) : 0;
      if (cheapest && partialQty >= cheapest.moq && partialQty < req.shortageQty) {
        return {
          allocations: [{ supplierId: cheapest.supplierId, qty: partialQty }],
          rationale: `[local test double] Initial reroute to ${cheapest.name}: ${partialQty}-unit partial allocation (lowest-price eligible supplier).`
        };
      }
    }

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

  // Unlike proposeRecoveryPlan's rationale (audit-trail-only, never rendered to
  // a judge — see shared/agent/fsm.ts's LLM_CALL audit event), this brief is
  // the one stub output shown directly in the Mission Control UI (Human
  // Approval Boundary panel / escalation modal). It intentionally does NOT
  // carry a "[local test double]" prefix here: PRD §45's "must not be faked"
  // transparency requirement is satisfied at the page level instead — the
  // live-mode banner already discloses "processed by the real deterministic
  // agent... local stand-in for Claude" — so this human-facing decision text
  // stays free of internal/debug terminology.
  async draftEscalationBrief(req: EscalationBriefRequest): Promise<string> {
    return (
      `Case ${req.caseId} requires human approval. ` +
      `${req.approvalReason} Plan: ${req.planSummary}. Validator: ${req.validationSummary}.`
    );
  }
}
