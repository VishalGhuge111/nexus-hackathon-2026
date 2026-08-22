// GET /api/analytics/summary?weeks=4 — weekly operations aggregation computed
// purely from real, already-persisted records (Case.createdAt and the
// AuditEvent log the FSM itself writes — shared/agent/fsm.ts / approvals.ts).
// No historical business metrics (revenue, generic "reliability trend", etc.)
// are invented: every bucketed number here is a count of real rows in a real
// time window, nothing else.
import { getStore } from "@nexus/shared/db/factory";
import type { Case } from "@nexus/shared/types/case";
import type { AuditEvent } from "@nexus/shared/types/audit";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface WeekBucket {
  weekStart: string; // ISO date (UTC) of the bucket's start
  weekEnd: string;
  casesCreated: number;
  successfulRecoveries: number; // STATE_TRANSITION -> GOAL_ACHIEVED
  noFeasibleRecoveries: number; // STATE_TRANSITION -> NO_FEASIBLE_RECOVERY
  approvalsGranted: number;
  approvalsRejected: number;
  failedValidations: number;
}

function buildBuckets(now: Date, weeks: number): { start: number; end: number }[] {
  const buckets: { start: number; end: number }[] = [];
  const end0 = now.getTime();
  for (let i = weeks - 1; i >= 0; i--) {
    const end = end0 - i * WEEK_MS;
    const start = end - WEEK_MS;
    buckets.push({ start, end });
  }
  return buckets;
}

function bucketIndexFor(ts: number, buckets: { start: number; end: number }[]): number {
  return buckets.findIndex((b) => ts >= b.start && ts < b.end);
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const weeksParam = Number(url.searchParams.get("weeks"));
  const weeks = Number.isFinite(weeksParam) ? Math.min(12, Math.max(1, Math.round(weeksParam))) : 4;

  const store = getStore();
  const [cases, auditEvents] = await Promise.all([store.listAllCases(), store.listAllAuditEvents()]);

  const now = new Date();
  const windowStart = now.getTime() - weeks * WEEK_MS;
  const ranges = buildBuckets(now, weeks);

  const buckets: WeekBucket[] = ranges.map((r) => ({
    weekStart: new Date(r.start).toISOString(),
    weekEnd: new Date(r.end).toISOString(),
    casesCreated: 0,
    successfulRecoveries: 0,
    noFeasibleRecoveries: 0,
    approvalsGranted: 0,
    approvalsRejected: 0,
    failedValidations: 0
  }));

  for (const c of cases as Case[]) {
    const ts = new Date(c.createdAt).getTime();
    const idx = bucketIndexFor(ts, ranges);
    if (idx >= 0) buckets[idx].casesCreated += 1;
  }

  for (const e of auditEvents as AuditEvent[]) {
    const ts = new Date(e.timestamp).getTime();
    const idx = bucketIndexFor(ts, ranges);
    if (idx < 0) continue;

    if (e.type === "STATE_TRANSITION" && e.detail?.to === "GOAL_ACHIEVED") {
      buckets[idx].successfulRecoveries += 1;
    } else if (e.type === "STATE_TRANSITION" && e.detail?.to === "NO_FEASIBLE_RECOVERY") {
      buckets[idx].noFeasibleRecoveries += 1;
    } else if (e.type === "HUMAN_ACTION" && e.detail?.decision === "APPROVED") {
      buckets[idx].approvalsGranted += 1;
    } else if (e.type === "HUMAN_ACTION" && e.detail?.decision === "REJECTED") {
      buckets[idx].approvalsRejected += 1;
    } else if (e.type === "VALIDATION" && e.detail?.overallPassed === false) {
      buckets[idx].failedValidations += 1;
    }
  }

  const totals = buckets.reduce(
    (sum, b) => ({
      casesCreated: sum.casesCreated + b.casesCreated,
      successfulRecoveries: sum.successfulRecoveries + b.successfulRecoveries,
      noFeasibleRecoveries: sum.noFeasibleRecoveries + b.noFeasibleRecoveries,
      approvalsGranted: sum.approvalsGranted + b.approvalsGranted,
      approvalsRejected: sum.approvalsRejected + b.approvalsRejected,
      failedValidations: sum.failedValidations + b.failedValidations
    }),
    {
      casesCreated: 0,
      successfulRecoveries: 0,
      noFeasibleRecoveries: 0,
      approvalsGranted: 0,
      approvalsRejected: 0,
      failedValidations: 0
    }
  );

  return Response.json({
    weeks,
    windowStart: new Date(windowStart).toISOString(),
    windowEnd: now.toISOString(),
    totalCasesAllTime: cases.length,
    totalAuditEventsAllTime: auditEvents.length,
    buckets,
    totals
  });
}
