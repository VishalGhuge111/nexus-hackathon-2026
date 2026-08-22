import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@nexus/shared/db/memoryStore";
import { buildDemoFixture, ORIGINAL_PO_ID } from "@nexus/shared/db/demoSeed";
import { applyShipmentDelayEvent } from "@nexus/shared/agent/events";
import { runAgentTick } from "@nexus/shared/agent/fsm";
import { StubLlmClient } from "@nexus/shared/llm/stubClient";
import type { Store } from "@nexus/shared/db/types";

const NOW = new Date("2026-08-22T00:00:00Z");

// Regression test for the proven concurrent-tick race: two overlapping
// POST /api/agent/tick requests for the SAME case (e.g. from a double-invoked
// client effect) previously reached shared/agent/fsm.ts's PLAN handler at the
// same time, both read the same pre-plan Case state, and both wrote a
// RecoveryPlanVersion numbered `1` — corrupting the plan lineage. The fix is a
// per-case in-process lock in runAgentTick (shared/agent/fsm.ts).
describe("PRD §10/§27 — concurrent agent-tick guard", () => {
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

  it("does not create duplicate/conflicting plan versions when two ticks for the same case run concurrently", async () => {
    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);

    // Advance EARLY_RISK_CHECK -> VERIFY -> PLAN sequentially so both racing
    // ticks below land on the same PLAN state that produces a plan version.
    await runAgentTick({ store, llm }, caseId, NOW);
    await runAgentTick({ store, llm }, caseId, NOW);
    const preRace = await store.getCase(caseId);
    expect(preRace?.status).toBe("PLAN");

    // Fire two concurrent ticks for the SAME case without awaiting between
    // them — this is exactly the shape of the proven StrictMode double-fetch.
    const [resultA, resultB] = await Promise.all([
      runAgentTick({ store, llm }, caseId, NOW),
      runAgentTick({ store, llm }, caseId, NOW)
    ]);

    // With the lock in place, the second call only starts once the first has
    // fully applied its state transition, so it observes PLAN having already
    // advanced to VALIDATE and becomes a no-op-shaped follow-on step rather
    // than a duplicate PLAN execution.
    const planVersions = await store.listPlanVersions(caseId);
    const versionNumbers = planVersions.map((v) => v.version);
    expect(versionNumbers).toEqual([1]);
    expect(new Set(planVersions.map((v) => v.id)).size).toBe(planVersions.length);

    expect([resultA.case.status, resultB.case.status]).toContain("VALIDATE");
  });

  it("does not block ticks for a different case while one case's tick is in flight", async () => {
    const { caseId: caseA } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);

    const fixtureB = buildDemoFixture(NOW);
    const storeB = new MemoryStore({
      productionOrders: [fixtureB.productionOrder],
      inventoryRecords: [fixtureB.inventoryRecord],
      suppliers: fixtureB.suppliers,
      purchaseOrders: fixtureB.purchaseOrders,
      emergencyBudget: fixtureB.emergencyBudget
    });
    const { caseId: caseB } = await applyShipmentDelayEvent(storeB, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);

    const [resultA, resultB] = await Promise.all([
      runAgentTick({ store, llm }, caseA, NOW),
      runAgentTick({ store: storeB, llm }, caseB, NOW)
    ]);

    expect(resultA.case.status).toBe("VERIFY");
    expect(resultB.case.status).toBe("VERIFY");
  });
});
