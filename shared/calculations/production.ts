// PRD §19 — production_requirement.

export interface ProductionRequirementInput {
  plannedQty: number;
  bomQtyPerUnit: number | null | undefined;
}

export type ProductionRequirementResult =
  | { status: "OK"; value: number }
  | { status: "NO_DATA" };

export function productionRequirement(
  input: ProductionRequirementInput
): ProductionRequirementResult {
  if (input.bomQtyPerUnit === null || input.bomQtyPerUnit === undefined) {
    return { status: "NO_DATA" };
  }
  return { status: "OK", value: input.plannedQty * input.bomQtyPerUnit };
}
