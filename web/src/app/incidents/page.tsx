'use client';
import React, { useState } from 'react';
import { IncidentGrid } from '../../components/dashboard/IncidentGrid';
import { CaseDetailOverlay } from '../../components/mission-control/CaseDetailOverlay';
import { usePolling } from '../../lib/api-client';
import type { DashboardSummary } from '../../lib/api-client';
import { AlertTriangle, Search } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { TriggerEventButton } from '../../components/dashboard/TriggerEventButton';
import { ErrorState } from '../../components/ui/ErrorState';

export default function IncidentsPage() {
  const { data, isLoading, error, refresh } = usePolling<DashboardSummary>('/api/dashboard/summary', 8000);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'CRITICAL' | 'STANDARD'>('ALL');

  const cases = data?.cases ?? [];

  const filteredCases = cases.filter((c) => {
    if (priorityFilter !== 'ALL' && (c.priority || 'STANDARD').toUpperCase() !== priorityFilter) {
      return false;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.id.toLowerCase().includes(term) ||
      c.status.toLowerCase().includes(term) ||
      (c.priority && c.priority.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50/70">
      <PageHeader
        title="Active Incidents"
        description="Live disruption tracker with automated risk evaluation and multi-agent recovery pipelines."
        icon={<AlertTriangle size={18} className="text-red-500" />}
        showBack={true}
        actions={
          <div className="flex items-center gap-2.5">
            <TriggerEventButton
              onTriggered={async (caseId) => {
                await refresh();
                setSelectedId(caseId);
              }}
            />
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border-b border-zinc-200/80 px-6 lg:px-8 py-3 shrink-0 flex items-center justify-between gap-4 flex-wrap shadow-2xs">
        <div className="relative w-full max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Case ID, status, or priority..."
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-50/80 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium">Priority:</span>
          <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70 text-xs">
            {(['ALL', 'CRITICAL', 'STANDARD'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                  priorityFilter === p
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <span className="text-xs font-mono text-zinc-400 pl-2">
            ({filteredCases.length} result{filteredCases.length === 1 ? '' : 's'})
          </span>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto p-6 lg:p-8 space-y-4 flex-1">
        {error && !data && (
          <ErrorState message={`Failed to load incidents: ${error}`} onRetry={() => refresh()} />
        )}
        {error && data && (
          <ErrorState message={`Live telemetry sync interrupted: ${error}`} compact />
        )}
        {(!error || data) && (
          <IncidentGrid
            cases={filteredCases}
            loading={isLoading && !data}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
          />
        )}
      </div>

      {selectedId && <CaseDetailOverlay caseId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}