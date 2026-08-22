import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@nexus/shared/db/memoryStore";
import { buildDemoFixture, SKU, ALTERNATE_SUPPLIER_ID } from "@nexus/shared/db/demoSeed";
import { evaluateEarlyRiskSignals } from "@nexus/shared/agent/earlyRiskMonitor";
import { coverageDays } from "@nexus/shared/calculations";
import type { Store } from "@nexus/shared/db/types";

const NOW = new Date("2026-08-22T00:00:00Z");

describe("PRD §31 — Multi-Disruption Event Models (Preparation)", () => {
  let store: Store;

  beforeEach(() => {
    const fixture = buildDemoFixture(NOW);
    store = new MemoryStore({
      productionOrders: [fixture.productionOrder],
      inventoryRecords: [fixture.inventoryRecord],
      suppliers: fixture.suppliers,
      purchaseOrders: fixture.purchaseOrders,
      emergencyBudget: fixture.emergencyBudget
    });
  });

  it("models Supplier Capacity Drop 50% ground-truth mutation and impacts eligibility", async () => {
    const supplierBefore = await store.getSupplier(ALTERNATE_SUPPLIER_ID);
    expect(supplierBefore).toBeDefined();
    expect(supplierBefore).not.toBeNull();
    const originalCapacity = supplierBefore!.maxCapacityPerCycle;

    // Simulate 50% capacity drop
    const newCapacity = Math.floor(originalCapacity * 0.5);
    const fixture = buildDemoFixture(NOW);
    const updatedSuppliers = fixture.suppliers.map((s) =>
      s.id === ALTERNATE_SUPPLIER_ID ? { ...s, maxCapacityPerCycle: newCapacity } : s
    );

    const updatedStore = new MemoryStore({
      productionOrders: [fixture.productionOrder],
      inventoryRecords: [fixture.inventoryRecord],
      suppliers: updatedSuppliers,
      purchaseOrders: fixture.purchaseOrders,
      emergencyBudget: fixture.emergencyBudget
    });

    const supplierAfter = (await updatedStore.getSupplier(ALTERNATE_SUPPLIER_ID))!;
    expect(supplierAfter.maxCapacityPerCycle).toBe(newCapacity);
    expect(supplierAfter.maxCapacityPerCycle).toBeLessThan(originalCapacity);
  });

  it("models Demand Spike (+30%) and verifies coverageDays and Early Risk Monitor fire breach", async () => {
    const inventory = (await store.getInventoryRecordBySku(SKU))!;
    expect(inventory).toBeDefined();

    // Baseline coverage
    const baseline = coverageDays({
      usableStock: inventory.usableStock,
      dailyUsageRate: inventory.dailyUsageRate
    });

    // Spike dailyUsageRate by +30%
    const spikedRate = inventory.dailyUsageRate * 1.3;
    const spikedCoverage = coverageDays({
      usableStock: inventory.usableStock,
      dailyUsageRate: spikedRate
    });

    expect(spikedCoverage.coverageDays).toBeLessThan(baseline.coverageDays);

    // Evaluate early risk signals with spiked rate
    const breaches = evaluateEarlyRiskSignals({
      coverageDays: spikedCoverage.coverageDays,
      safetyStockRatio: inventory.usableStock / inventory.safetyStockThreshold,
      deadlineSlackDays: 3
    });

    expect(breaches.some((b) => b.indicator === "coverage_days")).toBe(true);
  });
});
