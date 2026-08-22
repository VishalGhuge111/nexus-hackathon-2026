import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@nexus/shared/db/memoryStore";
import { buildDemoFixture, ORIGINAL_PO_ID } from "@nexus/shared/db/demoSeed";
import { applyShipmentDelayEvent } from "@nexus/shared/agent/events";
import { runAgentTick } from "@nexus/shared/agent/fsm";
import { resolveApproval } from "@nexus/shared/agent/approvals";
import { StubLlmClient } from "@nexus/shared/llm/stubClient";
import type { Store } from "@nexus/shared/db/types";
import type { Case } from "@nexus/shared/types/case";

const NOW = new Date("2026-08-22T00:00:00Z");

describe("PRD §10 / §23 / §24 — FSM Transitions & Terminal States", () => {
  let store: Store;
  let llm: StubLlmClient;

  beforeEach(() => {
    const fixture = buildDemoFixture(NOW);
    store = new MemoryStore({
      productionOrders: [fixture.productionOrder],
      inventoryRecords: [fixture.inventoryRecord],
      suppliers: fixture.suppliers,
      purchaseOrders: fixture.purchaseOrders,
      emergencyBudget: fixture.emergencyBudget
    });
    llm = new StubLlmClient();
  });

  it("advances step by step through legal FSM states in order", async () => {
    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);
    
    // 1. EARLY_RISK_CHECK -> VERIFY
    const tick1 = await runAgentTick({ store, llm }, caseId, NOW);
    expect(tick1.case.status).toBe("VERIFY");

    // 2. VERIFY -> PLAN
    const tick2 = await runAgentTick({ store, llm }, caseId, NOW);
    expect(tick2.case.status).toBe("PLAN");

    // 3. PLAN -> VALIDATE
    const tick3 = await runAgentTick({ store, llm }, caseId, NOW);
    expect(tick3.case.status).toBe("VALIDATE");
    expect(tick3.case.activePlanVersion).toBe(1);

    // 4. VALIDATE -> EXECUTE_OR_ESCALATE
    const tick4 = await runAgentTick({ store, llm }, caseId, NOW);
    expect(tick4.case.status).toBe("EXECUTE_OR_ESCALATE");

    // 5. EXECUTE_OR_ESCALATE -> HUMAN_ESCALATED_AWAITING_DECISION (due to CRITICAL priority flag in fixture)
    const tick5 = await runAgentTick({ store, llm }, caseId, NOW);
    expect(tick5.case.status).toBe("HUMAN_ESCALATED_AWAITING_DECISION");
  });

  it("terminal states (GOAL_ACHIEVED, NO_FEASIBLE_RECOVERY) and awaiting human decision are NO-OP on subsequent ticks", async () => {
    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);

    // Reach HUMAN_ESCALATED_AWAITING_DECISION
    for (let i = 0; i < 6; i++) {
      const { case: c } = await runAgentTick({ store, llm }, caseId, NOW);
      if (c.status === "HUMAN_ESCALATED_AWAITING_DECISION") break;
    }

    const stateBefore = await store.getCase(caseId);
    expect(stateBefore?.status).toBe("HUMAN_ESCALATED_AWAITING_DECISION");

    // Running tick while in awaiting-decision state must NOT change status or cycle
    const tickAwaiting = await runAgentTick({ store, llm }, caseId, NOW);
    expect(tickAwaiting.case.status).toBe("HUMAN_ESCALATED_AWAITING_DECISION");

    // Approve and reach GOAL_ACHIEVED
    const pending = (await store.getPendingApprovalForCase(caseId))!;
    await resolveApproval(store, pending.id, "APPROVED", "ops-test", NOW);

    for (let i = 0; i < 5; i++) {
      const { case: c } = await runAgentTick({ store, llm }, caseId, NOW);
      if (c.status === "GOAL_ACHIEVED") break;
    }

    const goalAchieved = await store.getCase(caseId);
    expect(goalAchieved?.status).toBe("GOAL_ACHIEVED");

    // Additional ticks on GOAL_ACHIEVED must remain completely no-op
    const noopTick = await runAgentTick({ store, llm }, caseId, NOW);
    expect(noopTick.case.status).toBe("GOAL_ACHIEVED");
  });

  it("handles V1 -> V2 replanning with explicit lineage, parent_version, and invalidated assumptions", async () => {
    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);

    // Run until HUMAN_ESCALATED_AWAITING_DECISION (Plan V1)
    for (let i = 0; i < 6; i++) {
      const { case: c } = await runAgentTick({ store, llm }, caseId, NOW);
      if (c.status === "HUMAN_ESCALATED_AWAITING_DECISION") break;
    }

    const v1 = await store.getActivePlanVersion(caseId);
    expect(v1).toBeDefined();
    expect(v1?.version).toBe(1);
    expect(v1?.parent_version).toBeNull();

    // Human REJECTS Plan V1 -> routes to ADAPT_REPLAN
    const pending = (await store.getPendingApprovalForCase(caseId))!;
    const { case: rejectedCase } = await resolveApproval(store, pending.id, "REJECTED", "ops-manager", NOW);
    expect(rejectedCase.status).toBe("ADAPT_REPLAN");

    // Next tick: ADAPT_REPLAN -> PLAN (replanCount = 1)
    const tickReplan = await runAgentTick({ store, llm }, caseId, NOW);
    expect(tickReplan.case.status).toBe("PLAN");
    expect(tickReplan.case.replanCount).toBe(1);

    // Next tick: PLAN -> VALIDATE (creates Plan V2 with parent_version = 1)
    const tickPlanV2 = await runAgentTick({ store, llm }, caseId, NOW);
    expect(tickPlanV2.case.status).toBe("VALIDATE");
    expect(tickPlanV2.case.activePlanVersion).toBe(2);

    const v2 = await store.getActivePlanVersion(caseId);
    expect(v2).toBeDefined();
    expect(v2?.version).toBe(2);
    expect(v2?.parent_version).toBe(1);
    expect(v2?.reason_for_change).toContain("human rejected");
    expect(v2?.invalidated_assumptions.length).toBeGreaterThan(0);
    expect(v2?.carried_forward_actions.length).toBeGreaterThan(0);

    // Both versions exist and are distinct
    const allVersions = await store.listPlanVersions(caseId);
    expect(allVersions.length).toBe(2);
    expect(allVersions[0].version).toBe(1);
    expect(allVersions[1].version).toBe(2);
  });
});
