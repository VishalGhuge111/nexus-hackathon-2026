'use client';
import React from 'react';
import { ShieldAlert, Package, PlayCircle, AlertTriangle } from 'lucide-react';
import type { DashboardSummaryCase } from '../../lib/api-client';

export interface IncidentGridProps {
  cases: DashboardSummaryCase[];
  loading?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

const PRIORITY_STYLE: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  STANDARD: 'bg-zinc-100 text-zinc-600'
};

export function IncidentGrid({ cases, loading = false, selectedId, onSelect }: IncidentGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm h-64 animate-pulse">
            <div className="h-6 bg-zinc-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-zinc-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-zinc-200 rounded w-1/4 mb-6"></div>
            <div className="h-10 bg-zinc-200 rounded w-full mt-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <ShieldAlert className="text-zinc-400 w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">No active incidents</h3>
        <p className="text-sm text-zinc-500 mt-1 max-w-sm">
          All supply chain nodes are operating within normal parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
      {cases.map((c) => {
        const isSelected = selectedId === c.id;
        const priority = (c.priority || 'STANDARD').toUpperCase();
        return (
          <div
            key={c.id}
            onClick={() => onSelect && onSelect(c.id)}
            className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden group cursor-pointer min-w-0 ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-zinc-200'}`}
          >
            {isSelected && <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>}

            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold mb-3 ${PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.STANDARD}`}>
                  <AlertTriangle size={12} /> {priority} PRIORITY
                </span>
                <h3 className="font-bold text-zinc-900 text-lg leading-tight break-words group-hover:text-blue-600 transition-colors">
                  {c.status.replace(/_/g, ' ')}
                </h3>
              </div>
              <span className="shrink-0 max-w-[45%] truncate text-xs font-mono text-zinc-500 bg-zinc-100 px-2 py-1 rounded" title={c.id}>
                {c.id}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <Package size={16} className="text-zinc-400 shrink-0" />
                <span className="truncate">Plan v{c.activePlanVersion ?? 0} &middot; {c.replanCount} replan(s)</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3 text-zinc-600 shrink-0">
                  <ShieldAlert size={16} className="text-zinc-400 shrink-0" />
                  <span>Units at risk</span>
                </div>
                <span className={`font-bold text-right ${c.continuityImpact.deadlineBreached ? 'text-red-600' : 'text-zinc-900'}`}>
                  {c.continuityImpact.unitsAtRisk}
                  {c.continuityImpact.deadlineBreached ? ' · deadline breached' : ''}
                </span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-zinc-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect && onSelect(c.id);
                }}
                className={`w-full flex cursor-pointer items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${isSelected ? 'bg-blue-50 text-blue-700' : 'bg-zinc-900 text-white hover:bg-blue-600'}`}
              >
                {isSelected ? (
                  <><PlayCircle size={16} /> Mission Active</>
                ) : (
                  <><PlayCircle size={16} /> Open Mission</>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
