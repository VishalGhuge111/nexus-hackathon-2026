// PRD §19 — coverage_days, stock discrepancy, safety_stock_risk.
// ALL coverage math uses usableStock, never currentStock (PS Scenario 2 / Hidden Test 2).

export interface CoverageDaysInput {
  usableStock: number;
  dailyUsageRate: number;
}

export interface CoverageDaysResult {
  coverageDays: number;
  dataIntegrityFlag: boolean;
}

export function coverageDays(input: CoverageDaysInput): CoverageDaysResult {
  let { usableStock } = input;
  let dataIntegrityFlag = false;
  if (usableStock < 0) {
    usableStock = 0;
    dataIntegrityFlag = true;
  }
  if (input.dailyUsageRate === 0) {
    return { coverageDays: Infinity, dataIntegrityFlag };
  }
  return { coverageDays: usableStock / input.dailyUsageRate, dataIntegrityFlag };
}

export function hasStockDiscrepancy(currentStock: number, usableStock: number): boolean {
  return Math.abs(currentStock - usableStock) > 0;
}

export interface SafetyStockRiskInput {
  usableStock: number;
  safetyStockThreshold: number;
}

export interface SafetyStockRiskResult {
  ratio: number | null;
  breach: boolean;
  disabled: boolean;
}

export function safetyStockRisk(input: SafetyStockRiskInput): SafetyStockRiskResult {
  if (input.safetyStockThreshold === 0) {
    return { ratio: null, breach: false, disabled: true };
  }
  const ratio = input.usableStock / input.safetyStockThreshold;
  return { ratio, breach: ratio < 1.0, disabled: false };
}
