import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@nexus/shared/db/memoryStore";
import { dispatchTool, type DispatchContext } from "@nexus/shared/tools/dispatch";
import { MAX_TOOL_CALLS_PER_CASE } from "@nexus/shared/config";
import type { AgentState } from "@nexus/shared/types/agent";

describe("PRD §13a — Tool Budget and Dispatch Choke Point", () => {
  let store: MemoryStore;
  let agentState: AgentState;
  let ctx: DispatchContext;

  beforeEach(() => {
    store = new MemoryStore();
    agentState = {
      caseId: "case-budget-test",
      currentStep: "VERIFY",
      cycle: 1,
      lastToolCalls: [],
      toolCallCount: 0,
      updatedAt: new Date().toISOString()
    };
    ctx = {
      store,
      caseId: "case-budget-test",
      cycle: 1,
      agentState,
      invokedBy: "AGENT"
    };
  });

  it("increments toolCallCount on successful tool dispatch and records lastToolCalls", async () => {
    const res1 = await dispatchTool(ctx, "inventory_lookup", async () => ({
      toolName: "inventory_lookup",
      status: "SUCCESS",
      data: { usableStock: 100 },
      latencyMs: 5
    }));

    expect(res1.status).toBe("SUCCESS");
    expect(agentState.toolCallCount).toBe(1);
    expect(agentState.lastToolCalls).toEqual(["inventory_lookup"]);

    const res2 = await dispatchTool(ctx, "purchase_order_lookup", async () => ({
      toolName: "purchase_order_lookup",
      status: "SUCCESS",
      data: { id: "po-1" },
      latencyMs: 3
    }));

    expect(res2.status).toBe("SUCCESS");
    expect(agentState.toolCallCount).toBe(2);
    expect(agentState.lastToolCalls).toEqual(["inventory_lookup", "purchase_order_lookup"]);
  });

  it("increments toolCallCount on FAILURE and NO_DATA outcomes as well", async () => {
    await dispatchTool(ctx, "shipment_tracking_lookup", async () => ({
      toolName: "shipment_tracking_lookup",
      status: "FAILURE",
      errorReason: "Carrier API timeout",
      latencyMs: 50
    }));
    expect(agentState.toolCallCount).toBe(1);

    await dispatchTool(ctx, "production_schedule_lookup", async () => ({
      toolName: "production_schedule_lookup",
      status: "NO_DATA",
      latencyMs: 10
    }));
    expect(agentState.toolCallCount).toBe(2);
  });

  it("enforces hard budget cap MAX_TOOL_CALLS_PER_CASE (16) and refuses subsequent calls", async () => {
    expect(MAX_TOOL_CALLS_PER_CASE).toBe(16);

    for (let i = 0; i < MAX_TOOL_CALLS_PER_CASE; i++) {
      const res = await dispatchTool(ctx, `mock_tool_${i}`, async () => ({
        toolName: `mock_tool_${i}`,
        status: "SUCCESS",
        data: i,
        latencyMs: 1
      }));
      expect(res.status).toBe("SUCCESS");
    }

    expect(agentState.toolCallCount).toBe(MAX_TOOL_CALLS_PER_CASE);

    // (N+1)th call must be blocked with BUDGET_EXHAUSTED
    const blockedRes = await dispatchTool(ctx, "mock_tool_overflow", async () => ({
      toolName: "mock_tool_overflow",
      status: "SUCCESS",
      data: -1,
      latencyMs: 1
    }));

    expect(blockedRes.status).toBe("FAILURE");
    expect(blockedRes.errorReason).toBe("BUDGET_EXHAUSTED");
    expect(agentState.toolCallCount).toBe(MAX_TOOL_CALLS_PER_CASE); // Count does not increment past max

    const auditEvents = await store.listAuditEvents("case-budget-test");
    const lastAudit = auditEvents[auditEvents.length - 1];
    expect(lastAudit.type).toBe("TOOL_CALL");
    expect(lastAudit.summary).toContain("refused: BUDGET_EXHAUSTED");
    expect(lastAudit.detail.refused).toBe("BUDGET_EXHAUSTED");
  });

  it("appends an audit event for every tool execution with status and latency", async () => {
    await dispatchTool(ctx, "inventory_lookup", async () => ({
      toolName: "inventory_lookup",
      status: "SUCCESS",
      data: { usableStock: 500 },
      latencyMs: 12
    }));

    const auditEvents = await store.listAuditEvents("case-budget-test");
    expect(auditEvents.length).toBe(1);
    expect(auditEvents[0].type).toBe("TOOL_CALL");
    expect(auditEvents[0].summary).toBe("inventory_lookup -> SUCCESS");
    expect(auditEvents[0].actor).toBe("AGENT");
    expect(auditEvents[0].detail.toolName).toBe("inventory_lookup");
    expect(auditEvents[0].detail.toolCallCount).toBe(1);
  });
});
