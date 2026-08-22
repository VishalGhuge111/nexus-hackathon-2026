import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@nexus/shared/db/memoryStore";
import { buildDemoFixture, ORIGINAL_PO_ID, ALTERNATE_SUPPLIER_ID, PRODUCTION_ORDER_ID } from "@nexus/shared/db/demoSeed";
import { applyShipmentDelayEvent, applySupplierClaimContradictionEvent } from "@nexus/shared/agent/events";
import { runAgentTick } from "@nexus/shared/agent/fsm";
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

describe("Supplier Claim Contradiction event", () => {
  let store: Store;
  let llm: StubLlmClient;

  beforeEach(() => {
    store = freshStore();
    llm = new StubLlmClient();
  });

  it("flags the supplier's hasOpenContradiction field for real and records the inbound claim + audit line", async () => {
    const { caseId } = await applySupplierClaimContradictionEvent(
      store,
      {
        poId: ORIGINAL_PO_ID,
        supplierId: ALTERNATE_SUPPLIER_ID,
        productionOrderId: PRODUCTION_ORDER_ID,
        claimedStatus: "dispatched, in transit",
        trackingStatus: "label created, no carrier pickup scanned"
      },
      NOW
    );

    const supplier = await store.getSupplier(ALTERNATE_SUPPLIER_ID);
    expect(supplier?.hasOpenContradiction).toBe(true);

    const messages = await store.listSupplierMessagesByCase(caseId);
    expect(messages.some((m) => m.direction === "INBOUND" && m.contradictionFlag === true)).toBe(true);

    const auditEvents = await store.listAuditEvents(caseId);
    expect(auditEvents.some((e) => e.summary.includes("SUPPLIER_CLAIM_CONTRADICTION"))).toBe(true);
  });

  it("a flagged supplier is excluded from the next recovery plan, with the reason recorded in the audit trail", async () => {
    // Flag the ONLY alternate supplier before the disruption even starts. Once
    // SHIPMENT_DELAY also excludes the original (delayed PO's own) supplier via
    // the existing excludeSupplierIds mechanism, zero suppliers remain eligible —
    // proving the contradiction flag genuinely participates in PLAN's real
    // eligibility gate (shared/agent/fsm.ts), not just sitting on the Supplier row.
    await applySupplierClaimContradictionEvent(
      store,
      {
        poId: ORIGINAL_PO_ID,
        supplierId: ALTERNATE_SUPPLIER_ID,
        productionOrderId: PRODUCTION_ORDER_ID,
        claimedStatus: "dispatched",
        trackingStatus: "no movement"
      },
      NOW
    );

    const { caseId } = await applyShipmentDelayEvent(store, { poId: ORIGINAL_PO_ID, delayHours: 24 }, NOW);
    const final = await tickUntil(store, llm, caseId, ["NO_FEASIBLE_RECOVERY", "HUMAN_ESCALATED_AWAITING_DECISION"]);

    expect(final.status).toBe("NO_FEASIBLE_RECOVERY");

    const auditEvents = await store.listAuditEvents(caseId);
    expect(
      auditEvents.some(
        (e) => e.summary.includes("Rejected supplier") && e.summary.includes("unresolved tracking/supplier contradiction")
      )
    ).toBe(true);
  });
});
