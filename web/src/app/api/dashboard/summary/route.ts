// PRD §27/§29 — GET /api/dashboard/summary: aggregate KPIs for the Mission Control
// top bar, plus the active Case list the left panel renders (§28) sorted by
// continuity impact — PRD's route list does not name a separate case-listing
// endpoint, so this is where that data is served from.
import { getStore } from "@nexus/shared/db/factory";

export async function GET(): Promise<Response> {
  const store = getStore();
  const activeCases = await store.listActiveCases();

  const sorted = [...activeCases].sort(
    (a, b) => b.continuityImpact.unitsAtRisk - a.continuityImpact.unitsAtRisk
  );

  const coverageDaysRemaining = Infinity; // requires multi-SKU aggregation not modeled in this slice
  const ordersAtRiskCount = activeCases.filter((c) => c.continuityImpact.unitsAtRisk > 0).length;
  const unitsAtRisk = activeCases.reduce((sum, c) => sum + c.continuityImpact.unitsAtRisk, 0);
  const deadlinesBreachedCount = activeCases.filter((c) => c.continuityImpact.deadlineBreached).length;

  const budget = await store.getEmergencyBudget();

  return Response.json({
    kpis: {
      coverageDaysRemaining: Number.isFinite(coverageDaysRemaining) ? coverageDaysRemaining : null,
      ordersAtRiskCount,
      unitsAtRisk,
      deadlinesBreachedCount,
      emergencyBudgetRemaining: budget.remainingAmount
    },
    cases: sorted.map((c) => ({
      id: c.id,
      status: c.status,
      priority: c.priority,
      continuityImpact: c.continuityImpact,
      activePlanVersion: c.activePlanVersion,
      replanCount: c.replanCount,
      queuedBehindCaseId: c.queuedBehindCaseId
    }))
  });
}
