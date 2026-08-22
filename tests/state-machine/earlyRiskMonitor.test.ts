import { describe, it, expect } from "vitest";
import { evaluateEarlyRiskSignals, shouldOpenEarlyWarning } from "@nexus/shared/agent/earlyRiskMonitor";

describe("evaluateEarlyRiskSignals", () => {
  it("flags coverage_days breach below 5", () => {
    const breaches = evaluateEarlyRiskSignals({
      coverageDays: 4.33,
      safetyStockRatio: null,
      deadlineSlackDays: null
    });
    expect(breaches.map((b) => b.indicator)).toContain("coverage_days");
  });

  it("does not flag deadline slack when it is above the buffer", () => {
    const breaches = evaluateEarlyRiskSignals({
      coverageDays: 10,
      safetyStockRatio: 2,
      deadlineSlackDays: 5
    });
    expect(breaches).toHaveLength(0);
  });

  it("flags production_deadline_slack when below the 2-day buffer", () => {
    const breaches = evaluateEarlyRiskSignals({
      coverageDays: 10,
      safetyStockRatio: 2,
      deadlineSlackDays: -0.5
    });
    expect(breaches.map((b) => b.indicator)).toContain("production_deadline_slack");
  });
});

describe("shouldOpenEarlyWarning", () => {
  it("opens on two independent indicators breaching in the same cycle (rule A)", () => {
    const breaches = evaluateEarlyRiskSignals({
      coverageDays: 4.33,
      safetyStockRatio: 2,
      deadlineSlackDays: -0.5
    });
    expect(shouldOpenEarlyWarning(breaches, [])).toBe(true);
  });

  it("does not open on a single first-time breach", () => {
    const breaches = evaluateEarlyRiskSignals({
      coverageDays: 4.33,
      safetyStockRatio: 2,
      deadlineSlackDays: 5
    });
    expect(shouldOpenEarlyWarning(breaches, [])).toBe(false);
  });

  it("opens when one indicator persists across >= 2 consecutive cycles (rule B)", () => {
    const breaches = evaluateEarlyRiskSignals({
      coverageDays: 4.33,
      safetyStockRatio: 2,
      deadlineSlackDays: 5
    });
    expect(shouldOpenEarlyWarning(breaches, ["coverage_days"])).toBe(true);
  });
});
