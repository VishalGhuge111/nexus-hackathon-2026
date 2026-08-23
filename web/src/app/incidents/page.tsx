'use client';
import React, { useState } from 'react';
import { IncidentGrid } from '../../components/dashboard/IncidentGrid';
import { CaseDetailOverlay } from '../../components/mission-control/CaseDetailOverlay';
import { usePolling } from '../../lib/api-client';
import type { DashboardSummary } from '../../lib/api-client';
import { AlertTriangle, Filter, Search } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { TriggerEventButton } from '../../components/dashboard/TriggerEventButton';
import { ErrorState } from '../../components/ui/ErrorState';

export default function IncidentsPage() {
  const { data, isLoading, error, refresh } = usePolling<DashboardSummary>('/api/dashboard/summary', 10000);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCases = (data?.activeCases ?? data?.cases ?? []).filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.id.toLowerCase().includes(term) ||
      c.status.toLowerCase().includes(term) ||
      c.priority.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50">
      <PageHeader
        title="Active Incidents"
        description="All tracked supply chain disruptions requiring attention."
        icon={<AlertTriangle size={20} className="text-red-500" />}
        showBack={true}
        actions={
          <div className="flex items-center gap-3">
            <button className="flex cursor-pointer items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-50 shadow-sm">
              <Filter size={16} /> Filter
            </button>
            <TriggerEventButton
              onTriggered={async (caseId) => {
                await refresh();
                setSelectedId(caseId);
              }}
            />
          </div>
        }
      />
      
      <div className="bg-white border-b border-zinc-200 px-8 py-3 shrink-0 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search incidents by ID, status, or priority..."
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
      </div>
      
      <div className="flex-1 p-6 space-y-4">
        {error && !data && (
          <ErrorState message={`Failed to load incidents: ${error}`} onRetry={() => refresh()} />
        )}
        {error && data && (
          <ErrorState message={`Live updates interrupted: ${error}`} onRetry={() => refresh()} compact />
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