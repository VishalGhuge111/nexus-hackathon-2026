import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@nexus/shared/db/memoryStore";
import { buildDemoFixture, ORIGINAL_PO_ID, ORIGINAL_SUPPLIER_ID, PRODUCTION_ORDER_ID } from "@nexus/shared/db/demoSeed";
import { applySupplierCapacityDropEvent } from "@nexus/shared/agent/events";
import { runAgentTick } from "@nexus/shared/agent/fsm";
import { resolveApproval } from "@nexus/shared/agent/approvals";
import { StubLlmClient } from "@nexus/shared/llm/stubClient";
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

describe("Supplier Capacity Drop vertical slice", () => {
  let store: Store;
  let llm: StubLlmClient;
  let targetSupplierId: string;
  let targetProductionOrderId: string;

  beforeEach(() => {
    store = freshStore();
    llm = new StubLlmClient();
    targetSupplierId = ORIGINAL_SUPPLIER_ID;
    targetProductionOrderId = PRODUCTION_ORDER_ID;
  });

  it("opens a Case from the capacity drop event", async () => {
    const { caseId } = await applySupplierCapacityDropEvent(store, { 
      supplierId: targetSupplierId, 
      productionOrderId: targetProductionOrderId, 
      capacityDropPercent: 50, 
      newMaxCapacityPerCycle: 200 
    }, NOW);
    const caseRecord = await store.getCase(caseId);
    expect(caseRecord?.status).toBe("EARLY_RISK_CHECK");

    const supplier = await store.getSupplier(targetSupplierId);
    expect(supplier?.maxCapacityPerCycle).toBe(200);
  });

  it("walks through the pipeline for capacity drop", async () => {
    const { caseId } = await applySupplierCapacityDropEvent(store, { 
      supplierId: targetSupplierId, 
      productionOrderId: targetProductionOrderId, 
      capacityDropPercent: 50, 
      newMaxCapacityPerCycle: 200 
    }, NOW);

    // Depending on the exact logic for EARLY_RISK_CHECK, it should go to VERIFY and then PLAN
    const escalated = await tickUntil(store, llm, caseId, ["HUMAN_ESCALATED_AWAITING_DECISION", "NO_FEASIBLE_RECOVERY", "GOAL_ACHIEVED", "MONITORING"]);
    expect(escalated.status).not.toBe("OPEN"); // Just verifying it progressed successfully
  });
});
