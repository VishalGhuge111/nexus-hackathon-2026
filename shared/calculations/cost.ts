// PRD §19 — recovery_cost, incremental_cost.

export interface CostAllocation {
  unitPrice: number;
  qty: number;
  expediteFeeIfAny?: number;
  shippingCost?: number;
}

export function recoveryCost(allocations: CostAllocation[]): number {
  return allocations.reduce(
    (sum, a) => sum + a.unitPrice * a.qty + (a.expediteFeeIfAny ?? 0) + (a.shippingCost ?? 0),
    0
  );
}

export function incrementalCost(recoveryCostValue: number, plannedBaselineCost: number): number {
  return recoveryCostValue - plannedBaselineCost;
}
