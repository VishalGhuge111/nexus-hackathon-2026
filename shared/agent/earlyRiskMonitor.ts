// PRD §11 — Early Risk Monitor. Deterministic, rule-based trigger source, no LLM.
import { EARLY_WARNING_THRESHOLDS, DEFAULT_LEAD_TIME_BUFFER_DAYS } from "../config";

export interface IndicatorBreach {
  indicator: string;
  value: number;
  threshold: number;
}

export interface EarlyRiskCheckInput {
  coverageDays: number;
  safetyStockRatio: number | null;
  deadlineSlackDays: number | null;
  supplierReliabilityScore?: number;
}

export function evaluateEarlyRiskSignals(input: EarlyRiskCheckInput): IndicatorBreach[] {
  const breaches: IndicatorBreach[] = [];

  if (input.coverageDays < EARLY_WARNING_THRESHOLDS.coverageDaysBreach) {
    breaches.push({
      indicator: "coverage_days",
      value: input.coverageDays,
      threshold: EARLY_WARNING_THRESHOLDS.coverageDaysBreach
    });
  }

  if (
    input.safetyStockRatio !== null &&
    input.safetyStockRatio < EARLY_WARNING_THRESHOLDS.safetyStockRatioBreach
  ) {
    breaches.push({
      indicator: "safety_stock_ratio",
      value: input.safetyStockRatio,
      threshold: EARLY_WARNING_THRESHOLDS.safetyStockRatioBreach
    });
  }

  if (input.deadlineSlackDays !== null && input.deadlineSlackDays < DEFAULT_LEAD_TIME_BUFFER_DAYS) {
    breaches.push({
      indicator: "production_deadline_slack",
      value: input.deadlineSlackDays,
      threshold: DEFAULT_LEAD_TIME_BUFFER_DAYS
    });
  }

  if (
    input.supplierReliabilityScore !== undefined &&
    input.supplierReliabilityScore < EARLY_WARNING_THRESHOLDS.supplierReliabilityScoreBreach
  ) {
    breaches.push({
      indicator: "supplier_reliability_score",
      value: input.supplierReliabilityScore,
      threshold: EARLY_WARNING_THRESHOLDS.supplierReliabilityScoreBreach
    });
  }

  return breaches;
}

/**
 * PRD §11 trigger rule: (A) two independent indicators breach in the same cycle,
 * OR (B) one indicator remains breached across >= 2 consecutive cycles.
 */
export function shouldOpenEarlyWarning(
  currentBreaches: IndicatorBreach[],
  priorCycleBreachedIndicators: string[]
): boolean {
  if (currentBreaches.length >= 2) return true;
  if (
    currentBreaches.length === 1 &&
    priorCycleBreachedIndicators.includes(currentBreaches[0].indicator)
  ) {
    return true;
  }
  return false;
}
