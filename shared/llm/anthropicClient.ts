// Real Claude integration — PRD §9: Sonnet handles recovery-plan proposal, trade-off
// reasoning, and drafting. This file never performs arithmetic, validation, or
// eligibility checks itself; it only proposes, and the Deterministic Validator
// (shared/validator) is the only thing that can let a proposal take effect.
import Anthropic from "@anthropic-ai/sdk";
import { ProposedPlanSchema } from "./schemas";
import type { EscalationBriefRequest, LlmClient, PlanProposalRequest, ProposedPlan } from "./types";

const SONNET_MODEL = "claude-sonnet-5"; // PRD §9: Sonnet for reasoning/drafting

const PROPOSE_PLAN_TOOL: Anthropic.Tool = {
  name: "propose_recovery_plan",
  description:
    "Propose a recovery plan allocating the shortage quantity across one or more eligible suppliers. " +
    "You may only choose suppliers from the eligible list provided — they have already passed all " +
    "deterministic eligibility checks. You choose WHICH eligible suppliers and HOW MUCH to allocate to " +
    "each; a separate deterministic validator will independently check cost, deadline, and coverage.",
  input_schema: {
    type: "object",
    properties: {
      allocations: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            supplierId: { type: "string", description: "Must be one of the provided eligible supplier IDs." },
            qty: { type: "number", description: "Units to allocate to this supplier." }
          },
          required: ["supplierId", "qty"]
        }
      },
      rationale: {
        type: "string",
        description: "Brief human-readable explanation of the trade-off behind this allocation."
      }
    },
    required: ["allocations", "rationale"]
  }
};

function buildPlanPrompt(req: PlanProposalRequest): string {
  const suppliersText = req.eligibleSuppliers
    .map(
      (s) =>
        `- ${s.supplierId} (${s.name}): price=${s.pricePerUnit}/unit, leadTime=${s.leadTimeDays}d, ` +
        `reliability=${s.reliabilityScore}, quality=${s.qualityScore}, maxCapacity=${s.maxCapacityPerCycle}, moq=${s.moq}`
    )
    .join("\n");

  const rejection = req.previousPlanRejectionReason
    ? `\n\nYour previous proposal was rejected: ${req.previousPlanRejectionReason}\nPropose a corrected plan.`
    : "";

  return (
    `A supply disruption has occurred: ${req.disruptionSummary}\n\n` +
    `SKU: ${req.sku}\nShortage to cover: ${req.shortageQty} units\n` +
    `Today: ${req.today}\nProduction deadline: ${req.deadlineDate}\n\n` +
    `Eligible suppliers (already passed certification/MOQ/reliability/quality gates):\n${suppliersText}\n\n` +
    `Call propose_recovery_plan exactly once with an allocation plan covering the shortage, preferring ` +
    `fewer suppliers, lower cost, and suppliers that can deliver comfortably before the deadline.${rejection}`
  );
}

export class AnthropicLlmClient implements LlmClient {
  private readonly client: Anthropic;

  constructor(apiKey?: string) {
    this.client = apiKey ? new Anthropic({ apiKey }) : new Anthropic();
  }

  async proposeRecoveryPlan(req: PlanProposalRequest): Promise<ProposedPlan> {
    return this.proposeWithRetry(req, 1);
  }

  private async proposeWithRetry(req: PlanProposalRequest, attempt: number): Promise<ProposedPlan> {
    const message = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 2000,
      system:
        "You are NEXUS's recovery-plan proposer. You only propose candidate allocations; you never " +
        "compute costs, validate constraints, or decide whether a plan executes — deterministic code does that.",
      tools: [PROPOSE_PLAN_TOOL],
      tool_choice: { type: "auto" },
      messages: [{ role: "user", content: buildPlanPrompt(req) }]
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === "tool_use" && block.name === "propose_recovery_plan"
    );

    if (!toolUse) {
      if (attempt >= 2) {
        throw new Error("NO_VALID_PLAN_PROPOSED: model did not call propose_recovery_plan");
      }
      return this.proposeWithRetry(
        { ...req, previousPlanRejectionReason: "You must call the propose_recovery_plan tool." },
        attempt + 1
      );
    }

    const parsed = ProposedPlanSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      if (attempt >= 2) {
        throw new Error(`NO_VALID_PLAN_PROPOSED: schema validation failed: ${parsed.error.message}`);
      }
      return this.proposeWithRetry(
        {
          ...req,
          previousPlanRejectionReason: `Your proposal failed schema validation: ${parsed.error.message}`
        },
        attempt + 1
      );
    }

    return parsed.data;
  }

  async draftEscalationBrief(req: EscalationBriefRequest): Promise<string> {
    const message = await this.client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content:
            `Draft a concise (3-5 sentence) decision brief for a human ops controller who must approve or ` +
            `reject a recovery plan.\nCase: ${req.caseId}\nPlan: ${req.planSummary}\n` +
            `Validator result: ${req.validationSummary}\nWhy approval is required: ${req.approvalReason}`
        }
      ]
    });
    const text = message.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    return text?.text ?? "Escalation brief unavailable.";
  }
}
