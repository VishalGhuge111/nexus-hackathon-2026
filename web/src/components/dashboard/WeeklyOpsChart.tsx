'use client';

// Real weekly-operations chart — every number comes from GET /api/analytics/summary,
// which aggregates actual Case.createdAt timestamps and actual AuditEvent rows
// the FSM wrote (shared/agent/fsm.ts / approvals.ts). No historical series is
// invented; a week with no activity renders as a zero-height bar, not a
// plausible-looking fake value.
import { useState } from 'react';
import type { AnalyticsWeekBucket } from '../../lib/api-client';

const SERIES: { key: keyof Omit<AnalyticsWeekBucket, 'weekStart' | 'weekEnd'>; label: string; color: string }[] = [
  { key: 'casesCreated', label: 'Cases Created', color: 'bg-zinc-400' },
  { key: 'successfulRecoveries', label: 'Successful Recoveries', color: 'bg-emerald-500' },
  { key: 'approvalsGranted', label: 'Approvals Granted', color: 'bg-blue-500' },
  { key: 'failedValidations', label: 'Validator Rejections', color: 'bg-amber-500' }
];

function weekLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

export function WeeklyOpsChart({ buckets }: { buckets: AnalyticsWeekBucket[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...buckets.flatMap((b) => SERIES.map((s) => b[s.key])));
  const anyActivity = buckets.some((b) => SERIES.some((s) => b[s.key] > 0));

  if (!anyActivity) {
    return (
      <div className="py-16 text-center text-sm text-zinc-400">
        No activity in this window yet. Trigger a disruption to generate real weekly data.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end gap-3 h-48 pb-2 px-1">
        {buckets.map((b, i) => (
          <div
            key={b.weekStart}
            className="flex-1 relative flex items-end justify-center gap-0.5 h-full group"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
          >
            {hovered === i && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-10 w-52 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg text-xs">
                <p className="font-bold text-zinc-900 mb-1.5">Week of {b.weekStart.slice(0, 10)}</p>
                <div className="space-y-1">
                  {SERIES.map((s) => (
                    <div key={s.key} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-zinc-500">
                        <span className={`w-2 h-2 rounded-sm ${s.color}`} /> {s.label}
                      </span>
                      <span className="font-mono font-semibold text-zinc-900">{b[s.key]}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-100">
                    <span className="text-zinc-500">No Feasible Recovery</span>
                    <span className="font-mono font-semibold text-zinc-900">{b.noFeasibleRecoveries}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500">Approvals Rejected</span>
                    <span className="font-mono font-semibold text-zinc-900">{b.approvalsRejected}</span>
                  </div>
                </div>
              </div>
            )}
            {SERIES.map((s) => {
              const value = b[s.key];
              const heightPct = (value / max) * 100;
              return (
                <div
                  key={s.key}
                  className={`w-2.5 rounded-t-sm transition-all ${s.color} ${hovered === i ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                  style={{ height: value > 0 ? `${Math.max(heightPct, 3)}%` : '2px' }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 px-1 border-t border-zinc-100 pt-2">
        {buckets.map((b) => (
          <span key={b.weekStart} className="flex-1 text-center text-[11px] text-zinc-400">
            {weekLabel(b.weekStart)}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-zinc-100">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className={`w-2.5 h-2.5 rounded-sm ${s.color}`} /> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
