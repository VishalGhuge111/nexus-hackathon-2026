'use client';
import React, { useEffect, useState } from 'react';
import { BarChart2, Activity } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { WeeklyOpsChart } from '../../components/dashboard/WeeklyOpsChart';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { fetchAnalyticsSummary } from '../../lib/api-client';
import type { AnalyticsSummary } from '../../lib/api-client';

const PERIODS = [4, 8, 12];

function ChartSkeleton() {
  return (
    <div className="flex items-end gap-3 h-48 pb-2 px-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex-1 flex items-end justify-center gap-1 h-full">
          <Skeleton className="w-3" style={{ height: `${20 + ((i * 37) % 70)}%` }} />
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [weeks, setWeeks] = useState(4);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    setError(null);
    fetchAnalyticsSummary(weeks)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [weeks, reloadKey]);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50/70">
      <PageHeader
        title="Operations Analytics"
        description="Historical telemetry aggregated directly from Case records and immutable AuditEvent logs."
        icon={<BarChart2 size={18} className="text-blue-600" />}
        showBack={true}
        actions={
          <div className="flex items-center gap-1 bg-white border border-zinc-200/80 rounded-lg p-1 shadow-2xs">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setWeeks(p)}
                className={`cursor-pointer px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                  weeks === p ? 'bg-zinc-900 text-white shadow-2xs' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {p} Weeks
              </button>
            ))}
          </div>
        }
      />

      <div className="max-w-7xl w-full mx-auto p-6 lg:p-8 space-y-6 flex-1">
        {error ? (
          <ErrorState message={`Failed to load analytics: ${error}`} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : (
          <>
            {/* Chart Panel */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Disruption & Recovery Trends
                    </span>
                    <span className="text-blue-700 bg-blue-50 text-[10px] font-bold px-1.5 py-0.2 rounded border border-blue-100">
                      Weekly Buckets
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900 tracking-tight mt-0.5">
                    Operational Recovery Volume
                  </h2>
                </div>
                <p className="text-xs font-mono text-zinc-400">
                  {summary
                    ? `${summary.windowStart.slice(0, 10)} → ${summary.windowEnd.slice(0, 10)} (UTC)`
                    : `Last ${weeks} weeks`}
                </p>
              </div>

              {!summary ? <ChartSkeleton /> : <WeeklyOpsChart buckets={summary.buckets} />}
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
              {!summary
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-2xs space-y-2">
                      <Skeleton className="h-7 w-12" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))
                : [
                    { label: 'Cases Created', value: summary.totals.casesCreated, color: 'text-zinc-900', border: 'border-zinc-200/80' },
                    { label: 'Recoveries Succeeded', value: summary.totals.successfulRecoveries, color: 'text-emerald-700', border: 'border-emerald-200 bg-emerald-50/20' },
                    { label: 'Approvals Granted', value: summary.totals.approvalsGranted, color: 'text-blue-700', border: 'border-blue-200 bg-blue-50/20' },
                    { label: 'Approvals Rejected', value: summary.totals.approvalsRejected, color: 'text-amber-700', border: 'border-amber-200 bg-amber-50/20' },
                    { label: 'Validator Rejections', value: summary.totals.failedValidations, color: 'text-rose-700', border: 'border-rose-200 bg-rose-50/20' },
                    { label: 'No Feasible Recovery', value: summary.totals.noFeasibleRecoveries, color: 'text-zinc-700', border: 'border-zinc-200/80' }
                  ].map((m) => (
                    <div key={m.label} className={`bg-white border ${m.border} rounded-xl p-4 shadow-2xs flex flex-col justify-between`}>
                      <p className={`text-2xl font-black font-mono tracking-tight tabular-nums ${m.color}`}>
                        {m.value}
                      </p>
                      <p className="text-xs font-semibold text-zinc-600 mt-2">{m.label}</p>
                    </div>
                  ))}
            </div>

            {summary && (
              <div className="bg-white rounded-xl border border-zinc-200/70 p-4 flex items-center justify-between text-xs text-zinc-500 flex-wrap gap-2">
                <span className="flex items-center gap-2">
                  <Activity size={14} className="text-blue-600" />
                  <span>
                    Cumulative Telemetry: <strong className="text-zinc-900 font-mono">{summary.totalCasesAllTime}</strong> lifetime cases, <strong className="text-zinc-900 font-mono">{summary.totalAuditEventsAllTime}</strong> immutable audit events.
                  </span>
                </span>
                <span className="text-zinc-400 font-mono text-[11px]">Source: PostgreSQL Audit Event Store</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}