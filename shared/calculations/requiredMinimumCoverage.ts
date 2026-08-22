// PRD §19 / §16.1 — required_minimum_coverage.
//
// Interpretation note (documented per PRD §34 "smallest safe deviation" discipline):
// §19's formula sentence and its own worked example do not reconcile under a literal
// day-by-day reading (the example's day-0 coverage ratio is below the stated floor
// regardless of delivery-timing convention chosen). This implementation follows the
// section's own "in plain terms" restatement, which is unambiguous and is treated as
// authoritative here:
//   (a) usable stock must never dip below `safetyStockThreshold` (a units floor —
//       consistent with how safetyStockThreshold is used everywhere else in the PRD,
//       e.g. safety_stock_risk in coverage.ts) on any day between today and the deadline,
//       once planned deliveries are applied; AND
//   (b) usable stock plus all deliveries arriving on/before the deadline must fully
//       cover `production_requirement`.
// A delivery is applied at the start of its arrival day, before that day's consumption.

import { MS_PER_DAY } from "./constants";

export interface IncomingDelivery {
  qty: number;
  arrivalDate: Date;
}

export interface RequiredMinimumCoverageInput {
  usableStock: number;
  dailyUsageRate: number;
  safetyStockThreshold: number;
  productionRequirement: number;
  deadlineDate: Date;
  today: Date;
  incomingDeliveries: IncomingDelivery[];
}

export interface RequiredMinimumCoverageResult {
  coverageSufficient: boolean;
  projectedCoverageDaysAtDeadline: number;
  minProjectedStock: number;
  meetsProductionRequirement: boolean;
  neverBreachesSafetyFloor: boolean;
}

function arrivalDayIndex(today: Date, arrivalDate: Date): number {
  return Math.round((arrivalDate.getTime() - today.getTime()) / MS_PER_DAY);
}

export function requiredMinimumCoverage(
  input: RequiredMinimumCoverageInput
): RequiredMinimumCoverageResult {
  const daysUntilDeadline = Math.max(
    0,
    Math.ceil((input.deadlineDate.getTime() - input.today.getTime()) / MS_PER_DAY)
  );

  let stock = input.usableStock;
  let minProjectedStock = stock;
  let neverBreachesSafetyFloor = stock >= input.safetyStockThreshold;

  for (let day = 0; day <= daysUntilDeadline; day++) {
    for (const delivery of input.incomingDeliveries) {
      if (arrivalDayIndex(input.today, delivery.arrivalDate) === day) {
        stock += delivery.qty;
      }
    }
    if (stock < minProjectedStock) minProjectedStock = stock;
    if (stock < input.safetyStockThreshold) neverBreachesSafetyFloor = false;
    if (day < daysUntilDeadline) stock -= input.dailyUsageRate;
  }

  const onTimeDeliveredQty = input.incomingDeliveries
    .filter((d) => d.arrivalDate.getTime() <= input.deadlineDate.getTime())
    .reduce((sum, d) => sum + d.qty, 0);
  const totalAvailableByDeadline = input.usableStock + onTimeDeliveredQty;
  const meetsProductionRequirement = totalAvailableByDeadline >= input.productionRequirement;

  const projectedCoverageDaysAtDeadline =
    input.dailyUsageRate === 0 ? Infinity : totalAvailableByDeadline / input.dailyUsageRate;

  return {
    coverageSufficient: neverBreachesSafetyFloor && meetsProductionRequirement,
    projectedCoverageDaysAtDeadline,
    minProjectedStock,
    meetsProductionRequirement,
    neverBreachesSafetyFloor
  };
}
