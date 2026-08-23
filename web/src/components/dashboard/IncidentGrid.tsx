'use client';
import React from 'react';
import {
  ShieldAlert,
  Package,
  AlertTriangle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import type { DashboardSummaryCase } from '../../lib/api-client';

export interface IncidentGridProps {
  cases: DashboardSummaryCase[];
  loading?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

const PRIORITY_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  STANDARD: { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-200' }
};

const STATUS_MAP: Record<string, { label: string; tone: 'ok' | 'warn' | 'crit' | 'active' }> = {
  MONITORING: { label: 'Active Monitoring', tone: 'ok' },
  EARLY_RISK_CHECK: { label: 'Early Risk Check', tone: 'warn' },
  VERIFY: { label: 'Verifying Signal', tone: 'active' },
  PLAN: { label: 'Generating Plan', tone: 'active' },
  VALIDATE: { label: 'Constraint Validation', tone: 'active' },
  EXECUTE_OR_ESCALATE: { label: 'Awaiting Decision', tone: 'warn' },
  HUMAN_ESCALATED_AWAITING_DECISION: { label: 'Human Sign-off Required', tone: 'crit' },
  ADAPT_REPLAN: { label: 'Replanning Scenario', tone: 'warn' },
  VERIFY_OUTCOME: { label: 'Verifying Recovery', tone: 'active' },
  GOAL_ACHIEVED: { label: 'Goal Achieved', tone: 'ok' },
  NO_FEASIBLE_RECOVERY: { label: 'No Feasible Plan', tone: 'crit' }
};

export function IncidentGrid({ cases, loading = false, selectedId, onSelect }: IncidentGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-2xs h-60 animate-pulse flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-zinc-200 rounded-md w-24"></div>
                <div className="h-4 bg-zinc-100 rounded w-16"></div>
              </div>
              <div className="h-6 bg-zinc-200 rounded-md w-3/4"></div>
              <div className="h-4 bg-zinc-100 rounded w-1/2"></div>
            </div>
            <div className="h-9 bg-zinc-100 rounded-lg w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-10 flex flex-col items-center justify-center text-center select-none">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shadow-2xs mb-3">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="text-base font-bold text-zinc-900 tracking-tight">All Operations Nominal</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          No active disruptions detected. All manufacturing lines and supplier shipments are currently operating within established safety tolerances.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      {cases.map((c) => {
        const isSelected = selectedId === c.id;
        const priority = (c.priority || 'STANDARD').toUpperCase();
        const pStyle = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.STANDARD;
        const statusMeta = STATUS_MAP[c.status] ?? { label: c.status.replace(/_/g, ' '), tone: 'warn' };
        const deadlineBreached = c.continuityImpact?.deadlineBreached;
        const unitsAtRisk = c.continuityImpact?.unitsAtRisk ?? 0;

        return (
          <div
            key={c.id}
            onClick={() => onSelect && onSelect(c.id)}
            className={`bg-white rounded-xl border p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between relative overflow-hidden group cursor-pointer select-none ${
              isSelected
                ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/10'
                : 'border-zinc-200/90 hover:border-zinc-300'
            }`}
          >
            {isSelected && <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>}

            <div>
              {/* Header: Priority & ID */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}
                >
                  <AlertTriangle size={11} /> {priority} PRIORITY
                </span>
                <span
                  className="font-mono text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60 shrink-0"
                  title={c.id}
                >
                  {c.id}
                </span>
              </div>

              {/* Status / Step Title */}
              <h3 className="font-bold text-zinc-900 text-base leading-snug group-hover:text-blue-600 transition-colors">
                {statusMeta.label}
              </h3>

              {/* Key Indicators */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-600 bg-zinc-50/80 px-2.5 py-1.5 rounded-lg border border-zinc-100">
                  <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
                    <Package size={14} className="text-zinc-400 shrink-0" /> Recovery Plan
                  </span>
                  <span className="font-mono font-semibold text-zinc-800">
                    v{c.activePlanVersion ?? 1} · {c.replanCount} replan(s)
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-600 bg-zinc-50/80 px-2.5 py-1.5 rounded-lg border border-zinc-100">
                  <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
                    <ShieldAlert size={14} className="text-zinc-400 shrink-0" /> Units At Risk
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      unitsAtRisk > 0 ? 'text-red-600' : 'text-zinc-700'
                    }`}
                  >
                    {unitsAtRisk} units {deadlineBreached ? '(Breached)' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="mt-5 pt-3.5 border-t border-zinc-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-400 font-medium font-mono">
                Line 1 · Bearing Assy
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect && onSelect(c.id);
                }}
                className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                  isSelected
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-zinc-900 text-white hover:bg-blue-600'
                }`}
              >
                <span>{isSelected ? 'Active View' : 'Investigate Case'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}