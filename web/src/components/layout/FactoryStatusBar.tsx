import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Target } from 'lucide-react';

interface FactoryStatusBarProps {
  coverageDays: number | null;
  ordersSafe: number | null;
  recoveryCost: number | null;
  currentGoal?: string;
}

export function FactoryStatusBar({ coverageDays, ordersSafe, recoveryCost, currentGoal = 'Maintain Production Continuity' }: FactoryStatusBarProps) {
  const isWarning = coverageDays !== null && coverageDays >= 2 && coverageDays < 5;
  const isCritical = coverageDays !== null && coverageDays < 2;

  const StatusIcon = isCritical ? XCircle : isWarning ? AlertTriangle : CheckCircle;
  const statusColor = coverageDays === null ? 'text-zinc-400' : isCritical ? 'text-red-600' : isWarning ? 'text-amber-500' : 'text-emerald-600';
  const statusBg = coverageDays === null ? 'bg-zinc-50 border-zinc-200' : isCritical ? 'bg-red-50 border-red-200' : isWarning ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200';
  const statusLabel = coverageDays === null ? 'Coverage data unavailable' : isCritical ? 'Production at Risk' : isWarning ? 'Early Warning' : 'Production Protected';

  return (
    <div className={`border-b px-6 py-4 ${statusBg}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Factory Status</p>
          <div className="flex items-center gap-1.5">
            <StatusIcon size={16} className={statusColor} />
            <span className={`font-bold text-sm ${statusColor}`}>{statusLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-8 text-sm flex-wrap">
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Coverage</p>
            <p className={`font-bold text-base tabular-nums ${coverageDays === null ? 'text-zinc-300' : isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-zinc-900'}`}>
              {coverageDays === null ? 'No data' : `${coverageDays.toFixed(1)} Days`}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Orders Safe</p>
            <p className="font-bold text-base tabular-nums text-zinc-900">{ordersSafe === null ? '—' : ordersSafe.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Recovery Budget</p>
            <p className="font-bold text-base tabular-nums text-zinc-900">{recoveryCost === null ? '—' : `₹${recoveryCost.toLocaleString()}`}</p>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-600">
            <Target size={14} className="text-blue-500 shrink-0" />
            <div>
              <p className="text-xs text-zinc-400">Current Goal</p>
              <p className="font-semibold text-sm text-zinc-800">{currentGoal}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}