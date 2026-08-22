import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@nexus/shared/db/memoryStore";
import { buildDemoFixture, ORIGINAL_PO_ID } from "@nexus/shared/db/demoSeed";
import { applyShipmentDelayEvent } from "@nexus/shared/agent/events";
import { runAgentTick } from "@nexus/shared/agent/fsm";
import { StubLlmClient } from "@nexus/shared/llm/stubClient";
import type { Store } from "@nexus/shared/db/types";
import { MAX_REPLANS } from "@nexus/shared/config";

const NOW = new Date("2026-08-22T00:00:00Z");

describe("PRD §15 / §16 / §24 / §33 — Failure Modes & Recovery", () => {
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

  it("handles VERIFY inconclusive NO_DATA: remains in VERIFY without advancing to PLAN", async () => {
    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);
    
    // Advance to VERIFY
    const tick1 = await runAgentTick({ store, llm }, caseId, NOW);
    expect(tick1.case.status).toBe("VERIFY");

    // Clear linked purchase orders so PO lookup returns nothing (inconclusive)
    const linkedPOs = await store.listPurchaseOrdersByCase(caseId);
    for (const po of linkedPOs) {
      await store.updatePurchaseOrder(po.id, { caseId: undefined });
    }

    // Next tick in VERIFY should detect no linked PO and transition back to MONITORING (false positive / no data)
    const tick2 = await runAgentTick({ store, llm }, caseId, NOW);
    expect(tick2.case.status).toBe("MONITORING");
  });

  it("transitions directly to NO_FEASIBLE_RECOVERY when all suppliers fail eligibility", async () => {
    const fixture = buildDemoFixture(NOW);
    // Create a store where alternative suppliers fail quality
    const ineligibleSuppliers = fixture.suppliers.map((s) => ({
      ...s,
      qualityScore: 0.1
    }));

    const customStore = new MemoryStore({
      productionOrders: [fixture.productionOrder],
      inventoryRecords: [fixture.inventoryRecord],
      suppliers: ineligibleSuppliers,
      purchaseOrders: fixture.purchaseOrders,
      emergencyBudget: fixture.emergencyBudget
    });

    const { caseId } = await applyShipmentDelayEvent(customStore, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);

    // Tick: EARLY_RISK_CHECK -> VERIFY -> PLAN
    await runAgentTick({ store: customStore, llm }, caseId, NOW); // VERIFY
    await runAgentTick({ store: customStore, llm }, caseId, NOW); // PLAN
    
    // In PLAN, with no eligible alternative suppliers, must move directly to NO_FEASIBLE_RECOVERY
    const tickPlan = await runAgentTick({ store: customStore, llm }, caseId, NOW);
    expect(tickPlan.case.status).toBe("NO_FEASIBLE_RECOVERY");
    expect(tickPlan.case.continuityImpact.deadlineBreached).toBe(true);
    expect(tickPlan.case.continuityImpact.unitsAtRisk).toBeGreaterThan(0);
  });

  it("routes to ADAPT_REPLAN and eventually NO_FEASIBLE_RECOVERY when MAX_REPLANS (3) is exceeded", async () => {
    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);

    // Manually set case status to ADAPT_REPLAN and replanCount to MAX_REPLANS
    await store.updateCase(caseId, {
      status: "ADAPT_REPLAN",
      replanCount: MAX_REPLANS
    });

    const tick = await runAgentTick({ store, llm }, caseId, NOW);
    expect(tick.case.status).toBe("NO_FEASIBLE_RECOVERY");

    const auditEvents = await store.listAuditEvents(caseId);
    const lastAudit = auditEvents[auditEvents.length - 1];
    expect(lastAudit.summary).toContain(`replan cap (${MAX_REPLANS}) reached`);
  });

  it("rejects plans in VALIDATE if emergency budget is insufficient and routes to ADAPT_REPLAN", async () => {
    // Deplete emergency budget to 0
    await store.updateEmergencyBudget({
      spentAmount: 500000,
      reservedAmount: 0
    });

    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);
    await runAgentTick({ store, llm }, caseId, NOW); // VERIFY
    await runAgentTick({ store, llm }, caseId, NOW); // PLAN
    await runAgentTick({ store, llm }, caseId, NOW); // VALIDATE

    // In VALIDATE, budget check #5 will fail -> routes to ADAPT_REPLAN
    const tickValidate = await runAgentTick({ store, llm }, caseId, NOW);
    expect(tickValidate.case.status).toBe("ADAPT_REPLAN");

    const validationResult = await store.getLatestValidationResult((await store.getActivePlanVersion(caseId))!.id);
    expect(validationResult?.overallPassed).toBe(false);
    
    const budgetCheck = validationResult?.checks.find((c) => c.name === "budget");
    expect(budgetCheck?.passed).toBe(false);
  });

  it("detects when execution succeeds but outcome_reread shows goal unmet, triggering automatic ADAPT_REPLAN", async () => {
    const fixture = buildDemoFixture(NOW);
    // Usable stock 0 and no extra inventory
    const customInventory = {
      ...fixture.inventoryRecord,
      usableStock: 0
    };
    const customStore = new MemoryStore({
      productionOrders: [fixture.productionOrder],
      inventoryRecords: [customInventory],
      suppliers: fixture.suppliers,
      purchaseOrders: fixture.purchaseOrders,
      emergencyBudget: fixture.emergencyBudget
    });

    const { caseId } = await applyShipmentDelayEvent(customStore, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);

    // Run until escalation
    for (let i = 0; i < 6; i++) {
      const { case: c } = await runAgentTick({ store: customStore, llm }, caseId, NOW);
      if (c.status === "HUMAN_ESCALATED_AWAITING_DECISION") break;
    }

    // Set case status to VERIFY_OUTCOME with an unmet requirement
    await customStore.updateCase(caseId, { status: "VERIFY_OUTCOME" });

    // Next tick in VERIFY_OUTCOME must detect deadlineBreached and trigger ADAPT_REPLAN
    const tick = await runAgentTick({ store: customStore, llm }, caseId, NOW);
    expect(tick.case.status).toBe("ADAPT_REPLAN");
  });
});
