// End-to-end vertical slice: Event -> Case creation -> Agent FSM -> tool calls ->
// Deterministic validation -> escalation -> human approval -> execution ->
// outcome verification -> GOAL_ACHIEVED, all against the in-memory Store and the
// local stub LLM client (no external credentials required to run this).
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@nexus/shared/db/memoryStore";
import { buildDemoFixture, ORIGINAL_PO_ID } from "@nexus/shared/db/demoSeed";
import { applyShipmentDelayEvent } from "@nexus/shared/agent/events";
import { runAgentTick } from "@nexus/shared/agent/fsm";
import { resolveApproval } from "@nexus/shared/agent/approvals";
import { StubLlmClient } from "@nexus/shared/llm/stubClient";
import { MAX_TOOL_CALLS_PER_CASE } from "@nexus/shared/config";
import type { Store } from "@nexus/shared/db/types";
import type { Case } from "@nexus/shared/types/case";

const NOW = new Date("2026-08-22T00:00:00Z");

function freshStore(): Store {
  const fixture = buildDemoFixture(NOW);
  return new MemoryStore({
    productionOrders: [fixture.productionOrder],
    inventoryRecords: [fixture.inventoryRecord],
    suppliers: fixture.suppliers,
    purchaseOrders: fixture.purchaseOrders,
    emergencyBudget: fixture.emergencyBudget
  });
}

async function tickUntil(
  store: Store,
  llm: StubLlmClient,
  caseId: string,
  targetStatuses: Case["status"][],
  maxTicks = 15
): Promise<Case> {
  for (let i = 0; i < maxTicks; i++) {
    const { case: updated } = await runAgentTick({ store, llm }, caseId, NOW);
    if (targetStatuses.includes(updated.status)) return updated;
  }
  throw new Error(`Did not reach ${targetStatuses.join("/")} within ${maxTicks} ticks`);
}

describe("Shipment Delay 24h vertical slice", () => {
  let store: Store;
  let llm: StubLlmClient;

  beforeEach(() => {
    store = freshStore();
    // This suite intentionally exercises the V1-fails -> ADAPT_REPLAN -> V2-passes
    // golden path (see the "walks EARLY_RISK_CHECK -> ..." test below), so it
    // opts in to the stub's deliberate first-proposal undershoot. General-purpose
    // FSM tests (tests/state-machine/fsmTransitions.test.ts) intentionally do NOT
    // opt in, and get the default fully-covering first plan.
    llm = new StubLlmClient({ forceInitialUndershoot: true });
  });

  it("opens a Case from the disruption event", async () => {
    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);
    const caseRecord = await store.getCase(caseId);
    expect(caseRecord?.status).toBe("EARLY_RISK_CHECK");

    const po = await store.getPurchaseOrder(ORIGINAL_PO_ID);
    expect(po?.status).toBe("DELAYED");
    expect(po?.caseId).toBe(caseId);
  });

  it("walks EARLY_RISK_CHECK -> VERIFY -> PLAN -> VALIDATE and reaches HUMAN_ESCALATED_AWAITING_DECISION (CRITICAL priority always requires approval in this fixture)", async () => {
    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);

    const escalated = await tickUntil(store, llm, caseId, ["HUMAN_ESCALATED_AWAITING_DECISION", "NO_FEASIBLE_RECOVERY"]);
    expect(escalated.status).toBe("HUMAN_ESCALATED_AWAITING_DECISION");

    const auditEvents = await store.listAuditEvents(caseId);
    const types = auditEvents.map((e) => e.type);
    expect(types).toContain("STATE_TRANSITION");
    expect(types).toContain("TOOL_CALL");
    expect(types).toContain("VALIDATION");
    expect(types).toContain("LLM_CALL");

    // The stub LLM deliberately undershoots on its first proposal (see
    // shared/llm/stubClient.ts) so the golden-path demo genuinely exercises
    // ADAPT_REPLAN: V1 must fail validation, and only the corrected V2 passes.
    const validationEvents = auditEvents.filter((e) => e.type === "VALIDATION");
    expect(validationEvents.length).toBeGreaterThanOrEqual(2);
    expect(validationEvents[0].detail.overallPassed).toBe(false);
    expect(validationEvents[validationEvents.length - 1].detail.overallPassed).toBe(true);
    expect(escalated.replanCount).toBe(1);
  });

  it("resolves via human approval, executes, verifies outcome, and reaches GOAL_ACHIEVED", async () => {
    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);
    await tickUntil(store, llm, caseId, ["HUMAN_ESCALATED_AWAITING_DECISION"]);

    const approvals = (await store.getPendingApprovalForCase(caseId))!;
    expect(approvals.status).toBe("PENDING");

    const { case: afterApproval } = await resolveApproval(store, approvals.id, "APPROVED", "ops-controller@nexus", NOW);
    expect(afterApproval.status).toBe("VERIFY_OUTCOME");

    const final = await tickUntil(store, llm, caseId, ["GOAL_ACHIEVED", "ADAPT_REPLAN"]);
    expect(final.status).toBe("GOAL_ACHIEVED");
    expect(final.continuityImpact.deadlineBreached).toBe(false);

    const auditEvents = await store.listAuditEvents(caseId);
    expect(auditEvents.some((e) => e.actor === "HUMAN" && e.type === "HUMAN_ACTION")).toBe(true);
    expect(auditEvents.some((e) => e.summary.includes("erp_update"))).toBe(true);

    const purchaseOrders = await store.listPurchaseOrdersByCase(caseId);
    expect(purchaseOrders.length).toBeGreaterThan(1); // original delayed PO + new recovery PO(s)
  });

  it("respects the tool-call budget and never executes an unvalidated plan", async () => {
    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);
    const final = await tickUntil(store, llm, caseId, ["HUMAN_ESCALATED_AWAITING_DECISION"]);
    const agentState = await store.getAgentState(final.id);
    expect(agentState!.toolCallCount).toBeLessThanOrEqual(MAX_TOOL_CALLS_PER_CASE);
  });
});
