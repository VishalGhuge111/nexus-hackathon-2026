import { describe, it, expect } from "vitest";
import { productionRequirement } from "@nexus/shared/calculations";

describe("productionRequirement", () => {
  it("multiplies plannedQty by bomQtyPerUnit", () => {
    // PRD §19 example: plannedQty=500, bomQtyPerUnit=2 -> 1000
    const result = productionRequirement({ plannedQty: 500, bomQtyPerUnit: 2 });
    expect(result).toEqual({ status: "OK", value: 1000 });
  });

  it("returns NO_DATA when bomQtyPerUnit is missing, never assumes 1:1", () => {
    expect(productionRequirement({ plannedQty: 500, bomQtyPerUnit: undefined })).toEqual({
      status: "NO_DATA"
    });
  });
});
