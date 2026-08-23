'use client';

import { useState } from 'react';
import type { AnalyticsWeekBucket } from '../../lib/api-client';

const SERIES: { key: keyof Omit<AnalyticsWeekBucket, 'weekStart' | 'weekEnd'>; label: string; color: string; dot: string }[] = [
  { key: 'casesCreated', label: 'Cases Created', color: 'bg-zinc-500', dot: 'bg-zinc-500' },
  { key: 'successfulRecoveries', label: 'Successful Recoveries', color: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { key: 'approvalsGranted', label: 'Approvals Granted', color: 'bg-blue-500', dot: 'bg-blue-500' },
  { key: 'failedValidations', label: 'Validator Rejections', color: 'bg-amber-500', dot: 'bg-amber-500' }
];

const CHART_HEIGHT = 220;
const GRIDLINES = 4;

function weekLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

export function WeeklyOpsChart({ buckets }: { buckets: AnalyticsWeekBucket[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...buckets.flatMap((b) => SERIES.map((s) => b[s.key])));

  return (
    <div className="relative pt-6">
      {/* Chart Canvas */}
      <div className="relative flex items-end gap-3 px-2" style={{ height: CHART_HEIGHT }}>
        {/* Gridlines */}
        <div className="pointer-events-none absolute inset-x-2 inset-y-0 flex flex-col justify-between">
          {Array.from({ length: GRIDLINES + 1 }).map((_, i) => (
            <div key={i} className="h-px w-full bg-zinc-100" />
          ))}
        </div>

        {buckets.map((b, i) => {
          const isHovered = hovered === i;
          return (
            <div
              key={b.weekStart}
              className="relative z-10 flex-1 flex items-end justify-center gap-1.5 h-full group cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              {/* Tooltip positioned safely inside the card without clipping */}
              {isHovered && (
                <div
                  className={`pointer-events-none absolute z-40 w-56 rounded-xl border border-zinc-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-xs text-xs transition-all ${
                    i > buckets.length / 2 ? 'right-0 -top-2' : 'left-0 -top-2'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5 mb-2">
                    <p className="font-bold text-zinc-900">Week of {b.weekStart.slice(0, 10)}</p>
                    <span className="text-[10px] font-mono text-zinc-400">Telemetry</span>
                  </div>
                  <div className="space-y-1.5">
                    {SERIES.map((s) => (
                      <div key={s.key} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
                          <span className={`w-2.5 h-2.5 rounded-sm ${s.color}`} /> {s.label}
                        </span>
                        <span className="font-mono font-bold text-zinc-900">{b[s.key]}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-zinc-100 text-[11px]">
                      <span className="text-zinc-500">No Feasible Recovery</span>
                      <span className="font-mono font-semibold text-zinc-700">{b.noFeasibleRecoveries}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-zinc-500">Approvals Rejected</span>
                      <span className="font-mono font-semibold text-zinc-700">{b.approvalsRejected}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stacked Bars */}
              {SERIES.map((s) => {
                const value = b[s.key];
                if (value <= 0) return null;
                const heightPct = Math.max((value / max) * 100, 6);
                return (
                  <div
                    key={s.key}
                    className={`w-3.5 rounded-t-md transition-all ${s.color} ${
                      isHovered ? 'brightness-110 shadow-xs' : 'opacity-90 group-hover:opacity-100'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${s.label}: ${value}`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* X-Axis Labels */}
      <div className="flex items-center gap-3 px-2 border-t border-zinc-200/80 pt-2.5 mt-2">
        {buckets.map((b) => (
          <span key={b.weekStart} className="flex-1 text-center text-xs font-mono font-semibold text-zinc-500">
            {weekLabel(b.weekStart)}
          </span>
        ))}
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-3.5 border-t border-zinc-100">
        <div className="flex flex-wrap items-center gap-4">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium">
              <span className={`w-2.5 h-2.5 rounded-sm ${s.color}`} /> {s.label}
            </span>
          ))}
        </div>
        <span className="text-[11px] font-mono text-zinc-400">Hover bars to view breakdown</span>
      </div>
    </div>
  );
}