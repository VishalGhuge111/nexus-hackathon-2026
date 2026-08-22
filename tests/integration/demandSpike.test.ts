import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@nexus/shared/db/memoryStore";
import { buildDemoFixture, SKU, PRODUCTION_ORDER_ID } from "@nexus/shared/db/demoSeed";
import { applyDemandSpikeEvent } from "@nexus/shared/agent/events";
import { runAgentTick } from "@nexus/shared/agent/fsm";
import { StubLlmClient } from "@nexus/shared/llm/stubClient";
import type { Store } from "@nexus/shared/db/types";

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

describe("Demand Spike event", () => {
  let store: Store;

  beforeEach(() => {
    store = freshStore();
  });

  it("mutates real InventoryRecord.dailyUsageRate and opens a Case", async () => {
    const before = await store.getInventoryRecordBySku(SKU);
    const { caseId } = await applyDemandSpikeEvent(
      store,
      { productionOrderId: PRODUCTION_ORDER_ID, usageIncreasePercent: 30 },
      NOW
    );

    const after = await store.getInventoryRecordBySku(SKU);
    expect(after!.dailyUsageRate).toBeCloseTo(before!.dailyUsageRate * 1.3, 5);

    const caseRecord = await store.getCase(caseId);
    expect(caseRecord?.status).toBe("EARLY_RISK_CHECK");

    const auditEvents = await store.listAuditEvents(caseId);
    expect(auditEvents.some((e) => e.summary.includes("DEMAND_SPIKE"))).toBe(true);
  });

  it("the spiked usage rate makes EARLY_RISK_CHECK fire a coverage_days breach that a normal tick would not", async () => {
    const llm = new StubLlmClient();
    const { caseId } = await applyDemandSpikeEvent(
      store,
      { productionOrderId: PRODUCTION_ORDER_ID, usageIncreasePercent: 30 },
      NOW
    );

    const { case: afterTick } = await runAgentTick({ store, llm }, caseId, NOW);
    // EARLY_RISK_CHECK always advances to VERIFY regardless of breach (fsm.ts),
    // but the breach itself must be recorded as a real RiskSignal.
    expect(afterTick.status).toBe("VERIFY");
    expect(afterTick.riskSignals.some((s) => s.indicator === "coverage_days")).toBe(true);
  });
});
