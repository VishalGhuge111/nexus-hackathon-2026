// PRD §9 — the LLM is invoked as a stateless function at specific states only.
// It never touches the DB or any tool directly; every output is parsed and passed
// through the Deterministic Validator before it can change state.

export interface PlanProposalCandidateSupplier {
  supplierId: string;
  name: string;
  pricePerUnit: number;
  leadTimeDays: number;
  reliabilityScore: number;
  qualityScore: number;
  maxCapacityPerCycle: number;
  moq: number;
}

export interface PlanProposalRequest {
  caseId: string;
  sku: string;
  shortageQty: number;
  today: string;
  deadlineDate: string;
  disruptionSummary: string;
  eligibleSuppliers: PlanProposalCandidateSupplier[];
  previousPlanRejectionReason?: string;
}

export interface ProposedAllocation {
  supplierId: string;
  qty: number;
}

export interface ProposedPlan {
  allocations: ProposedAllocation[];
  rationale: string;
}

export interface EscalationBriefRequest {
  caseId: string;
  planSummary: string;
  validationSummary: string;
  approvalReason: string;
}

export interface LlmClient {
  proposeRecoveryPlan(req: PlanProposalRequest): Promise<ProposedPlan>;
  draftEscalationBrief(req: EscalationBriefRequest): Promise<string>;
}
