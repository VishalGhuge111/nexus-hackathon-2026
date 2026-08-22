// PRD §19 — continuity_impact.

export interface ContinuityImpactInput {
  productionRequirement: number;
  projectedAvailableStock: number;
  deadlineBreach: boolean;
}

export interface ContinuityImpactResult {
  unitsAtRisk: number;
  deadlineBreached: boolean;
}

export function continuityImpact(input: ContinuityImpactInput): ContinuityImpactResult {
  return {
    unitsAtRisk: Math.max(0, input.productionRequirement - input.projectedAvailableStock),
    deadlineBreached: input.deadlineBreach
  };
}
