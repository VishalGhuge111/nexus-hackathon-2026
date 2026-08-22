import { describe, it, expect } from "vitest";
import { continuityImpact } from "@nexus/shared/calculations";

describe("continuityImpact", () => {
  it("computes unitsAtRisk floored at 0", () => {
    // PRD §19 example: 1000 required, 700 projected -> unitsAtRisk = 300
    expect(
      continuityImpact({
        productionRequirement: 1000,
        projectedAvailableStock: 700,
        deadlineBreach: true
      })
    ).toEqual({ unitsAtRisk: 300, deadlineBreached: true });
  });

  it("floors unitsAtRisk at 0 when stock exceeds requirement", () => {
    expect(
      continuityImpact({
        productionRequirement: 500,
        projectedAvailableStock: 700,
        deadlineBreach: false
      }).unitsAtRisk
    ).toBe(0);
  });
});
