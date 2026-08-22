import { describe, it, expect } from "vitest";
import { requiredMinimumCoverage } from "@nexus/shared/calculations";

const today = new Date("2026-08-22T00:00:00Z");
function daysFromToday(n: number): Date {
  return new Date(today.getTime() + n * 24 * 60 * 60 * 1000);
}

describe("requiredMinimumCoverage", () => {
  it("passes when stock never dips below the safety floor and total meets production requirement", () => {
    const result = requiredMinimumCoverage({
      usableStock: 500,
      dailyUsageRate: 50,
      safetyStockThreshold: 150,
      productionRequirement: 700,
      today,
      deadlineDate: daysFromToday(8),
      incomingDeliveries: [{ qty: 300, arrivalDate: daysFromToday(2) }]
    });
    expect(result.meetsProductionRequirement).toBe(true);
    expect(result.neverBreachesSafetyFloor).toBe(true);
    expect(result.coverageSufficient).toBe(true);
  });

  it("fails when stock dips below the safety floor before the delivery arrives", () => {
    const result = requiredMinimumCoverage({
      usableStock: 390,
      dailyUsageRate: 90,
      safetyStockThreshold: 150,
      productionRequirement: 700,
      today,
      deadlineDate: daysFromToday(8),
      incomingDeliveries: [{ qty: 600, arrivalDate: daysFromToday(4) }]
    });
    expect(result.neverBreachesSafetyFloor).toBe(false);
    expect(result.coverageSufficient).toBe(false);
  });

  it("fails when total available by deadline is short of production requirement", () => {
    const result = requiredMinimumCoverage({
      usableStock: 100,
      dailyUsageRate: 10,
      safetyStockThreshold: 20,
      productionRequirement: 1000,
      today,
      deadlineDate: daysFromToday(5),
      incomingDeliveries: [{ qty: 200, arrivalDate: daysFromToday(2) }]
    });
    expect(result.meetsProductionRequirement).toBe(false);
    expect(result.coverageSufficient).toBe(false);
  });

  it("treats a delivery arriving after the deadline as not counting (deadline check catches it independently too)", () => {
    const result = requiredMinimumCoverage({
      usableStock: 100,
      dailyUsageRate: 10,
      safetyStockThreshold: 20,
      productionRequirement: 500,
      today,
      deadlineDate: daysFromToday(5),
      incomingDeliveries: [{ qty: 1000, arrivalDate: daysFromToday(10) }]
    });
    expect(result.meetsProductionRequirement).toBe(false);
  });
});
