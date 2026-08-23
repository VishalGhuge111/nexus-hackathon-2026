import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Target, ShieldCheck } from 'lucide-react';

interface FactoryStatusBarProps {
  coverageDays: number | null;
  ordersSafe: number | null;
  recoveryCost: number | null;
  currentGoal?: string;
}

export function FactoryStatusBar({
  coverageDays,
  ordersSafe,
  recoveryCost,
  currentGoal = 'Maintain Production Continuity'
}: FactoryStatusBarProps) {
  const isWarning = coverageDays !== null && coverageDays >= 2 && coverageDays < 5;
  const isCritical = coverageDays !== null && coverageDays < 2;

  const StatusIcon = isCritical ? XCircle : isWarning ? AlertTriangle : CheckCircle2;
  const statusColor =
    coverageDays === null
      ? 'text-zinc-500'
      : isCritical
      ? 'text-red-700'
      : isWarning
      ? 'text-amber-700'
      : 'text-emerald-700';

  const statusBadge =
    coverageDays === null
      ? 'bg-zinc-100 text-zinc-700 border-zinc-200'
      : isCritical
      ? 'bg-red-50 text-red-700 border-red-200'
      : isWarning
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-emerald-50 text-emerald-800 border-emerald-200';

  const statusLabel =
    coverageDays === null
      ? 'Coverage Unavailable'
      : isCritical
      ? 'Production at Risk'
      : isWarning
      ? 'Early Risk Warning'
      : 'Production Protected';

  return (
    <div className="border-b border-zinc-200/80 bg-white px-6 py-3.5 shadow-2xs">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Factory State Badge */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            Factory Status
          </span>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold ${statusBadge}`}>
            <StatusIcon size={14} className={statusColor} />
            <span>{statusLabel}</span>
          </div>
        </div>

        {/* Live Operational Metrics */}
        <div className="flex items-center gap-8 text-xs flex-wrap">
          <div className="flex flex-col">
            <span className="text-[11px] text-zinc-400 font-medium">Inventory Coverage</span>
            <span
              className={`font-bold font-mono text-sm tabular-nums ${
                coverageDays === null
                  ? 'text-zinc-400'
                  : isCritical
                  ? 'text-red-600 font-black'
                  : isWarning
                  ? 'text-amber-600 font-black'
                  : 'text-zinc-900'
              }`}
            >
              {coverageDays === null ? '—' : `${coverageDays.toFixed(1)} Days`}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-zinc-400 font-medium">Orders Protected</span>
            <span className="font-bold font-mono text-sm tabular-nums text-zinc-900">
              {ordersSafe === null ? '—' : ordersSafe.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-zinc-400 font-medium">Emergency Budget</span>
            <span className="font-bold font-mono text-sm tabular-nums text-zinc-900">
              {recoveryCost === null ? '—' : `₹${recoveryCost.toLocaleString('en-IN')}`}
            </span>
          </div>

          <div className="flex items-center gap-2 pl-4 border-l border-zinc-200/80">
            <Target size={15} className="text-blue-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Current Goal</span>
              <span className="font-semibold text-xs text-zinc-800 tracking-tight">{currentGoal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}