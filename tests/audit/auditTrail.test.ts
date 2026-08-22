import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@nexus/shared/db/memoryStore";
import { buildDemoFixture, ORIGINAL_PO_ID } from "@nexus/shared/db/demoSeed";
import { applyShipmentDelayEvent } from "@nexus/shared/agent/events";
import { runAgentTick } from "@nexus/shared/agent/fsm";
import { resolveApproval } from "@nexus/shared/agent/approvals";
import { StubLlmClient } from "@nexus/shared/llm/stubClient";
import type { Store } from "@nexus/shared/db/types";
import type { AuditEvent } from "@nexus/shared/types/audit";

const NOW = new Date("2026-08-22T00:00:00Z");

describe("PRD §25 / §26 — Audit Trail Invariants", () => {
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

  it("is strictly append-only and retains every event across the Case lifecycle", async () => {
    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);
    
    // Check event 1 from ingestion
    let events = await store.listAuditEvents(caseId);
    expect(events.length).toBe(1);
    expect(events[0].actor).toBe("SYSTEM");
    expect(events[0].summary).toContain("Judge event SHIPMENT_DELAY");

    // Advance ticks through escalation
    for (let i = 0; i < 6; i++) {
      const { case: updated } = await runAgentTick({ store, llm }, caseId, NOW);
      if (updated.status === "HUMAN_ESCALATED_AWAITING_DECISION") break;
    }

    events = await store.listAuditEvents(caseId);
    expect(events.length).toBeGreaterThan(5);

    // Verify all events conform to the AuditEvent schema
    for (const event of events) {
      expect(event.id).toBeDefined();
      expect(typeof event.id).toBe("string");
      expect(event.caseId).toBe(caseId);
      expect(typeof event.cycle).toBe("number");
      expect(typeof event.timestamp).toBe("string");
      expect(["AGENT", "HUMAN", "SYSTEM"]).toContain(event.actor);
      expect(["STATE_TRANSITION", "TOOL_CALL", "LLM_CALL", "VALIDATION", "HUMAN_ACTION"]).toContain(event.type);
      expect(typeof event.summary).toBe("string");
      expect(typeof event.detail).toBe("object");
    }
  });

  it("contains all mandatory action types across an end-to-end recovery loop", async () => {
    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);

    // Tick to escalation
    while (true) {
      const { case: c } = await runAgentTick({ store, llm }, caseId, NOW);
      if (c.status === "HUMAN_ESCALATED_AWAITING_DECISION" || c.status === "NO_FEASIBLE_RECOVERY") break;
    }

    const pending = (await store.getPendingApprovalForCase(caseId))!;
    expect(pending).toBeDefined();

    // Human action: approval
    await resolveApproval(store, pending.id, "APPROVED", "ops-auditor@nexus", NOW);

    // Tick to goal achieved
    while (true) {
      const { case: c } = await runAgentTick({ store, llm }, caseId, NOW);
      if (c.status === "GOAL_ACHIEVED" || c.status === "NO_FEASIBLE_RECOVERY") break;
    }

    const events = await store.listAuditEvents(caseId);
    const types = new Set(events.map((e) => e.type));

    expect(types.has("STATE_TRANSITION")).toBe(true);
    expect(types.has("TOOL_CALL")).toBe(true);
    expect(types.has("LLM_CALL")).toBe(true);
    expect(types.has("VALIDATION")).toBe(true);
    expect(types.has("HUMAN_ACTION")).toBe(true);

    const humanEvent = events.find((e) => e.actor === "HUMAN");
    expect(humanEvent).toBeDefined();
    expect(humanEvent?.type).toBe("HUMAN_ACTION");
    expect(humanEvent?.summary).toContain("APPROVED");
    expect(humanEvent?.detail.resolvedBy).toBe("ops-auditor@nexus");
  });

  it("preserves immutable event order and does not mutate previously stored event timestamps or details", async () => {
    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);
    const initialEvents = await store.listAuditEvents(caseId);
    const initialSnapshot = JSON.stringify(initialEvents);

    await runAgentTick({ store, llm }, caseId, NOW);
    const afterFirstTick = await store.listAuditEvents(caseId);

    expect(afterFirstTick.length).toBeGreaterThan(initialEvents.length);
    expect(JSON.stringify(afterFirstTick.slice(0, initialEvents.length))).toBe(initialSnapshot);
  });
});
