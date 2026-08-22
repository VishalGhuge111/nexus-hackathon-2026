'use client';
import React, { useEffect, useState } from 'react';
import { BarChart2, Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { WeeklyOpsChart } from '../../components/dashboard/WeeklyOpsChart';
import { fetchAnalyticsSummary } from '../../lib/api-client';
import type { AnalyticsSummary } from '../../lib/api-client';

const PERIODS = [4, 8, 12];

export default function AnalyticsPage() {
  const [weeks, setWeeks] = useState(4);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    fetchAnalyticsSummary(weeks)
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    return () => { cancelled = true; };
  }, [weeks]);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50">
      <PageHeader
        title="Operations Analytics"
        description="Real aggregations from the Case and AuditEvent log — no invented history."
        icon={<BarChart2 size={20} className="text-purple-500" />}
        showBack={true}
        actions={
          <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setWeeks(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${weeks === p ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
              >
                {p}w
              </button>
            ))}
          </div>
        }
      />

      <div className="p-8 space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load analytics: {error}
          </div>
        )}

        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Weekly Operations</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {summary ? `${summary.windowStart.slice(0, 10)} to ${summary.windowEnd.slice(0, 10)} (UTC)` : `Last ${weeks} weeks`}
              </p>
            </div>
          </div>

          {!summary && !error ? (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-zinc-400">
              <Loader2 size={16} className="animate-spin" /> Loading analytics…
            </div>
          ) : summary ? (
            <WeeklyOpsChart buckets={summary.buckets} />
          ) : null}
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Cases Created', value: summary.totals.casesCreated },
              { label: 'Successful Recoveries', value: summary.totals.successfulRecoveries },
              { label: 'No Feasible Recovery', value: summary.totals.noFeasibleRecoveries },
              { label: 'Approvals Granted', value: summary.totals.approvalsGranted },
              { label: 'Approvals Rejected', value: summary.totals.approvalsRejected },
              { label: 'Validator Rejections', value: summary.totals.failedValidations }
            ].map((m) => (
              <div key={m.label} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-black text-zinc-900 tabular-nums">{m.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        {summary && (
          <p className="text-xs text-zinc-400">
            {summary.totalCasesAllTime} case(s) and {summary.totalAuditEventsAllTime} audit event(s) exist in total (all time, not just this window).
          </p>
        )}
      </div>
    </div>
  );
}
