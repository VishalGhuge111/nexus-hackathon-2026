'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Clock, Search, Download, Radio } from 'lucide-react';
import { fetchAllAuditEvents } from '../../lib/api-client';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import type { AuditEvent } from '@nexus/shared/types/audit';

const ACTOR_BADGE: Record<AuditEvent['actor'], { bg: string; text: string; border: string }> = {
  AGENT: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  HUMAN: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  SYSTEM: { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-200' }
};

function TimelineSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <Skeleton className="h-4 w-4 rounded-full mt-1 shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchAllAuditEvents()
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = (events ?? []).filter((e) => {
    if (!filter) return true;
    const term = filter.toLowerCase();
    return (
      e.summary.toLowerCase().includes(term) ||
      e.caseId.toLowerCase().includes(term) ||
      e.actor.toLowerCase().includes(term) ||
      e.type.toLowerCase().includes(term)
    );
  });

  function exportCSV() {
    if (!events || events.length === 0) return;
    const headers = ['Timestamp', 'Case ID', 'Actor', 'Event Type', 'Cycle', 'Summary'];
    const rows = events.map((e) => [
      `"${e.timestamp}"`,
      `"${e.caseId}"`,
      `"${e.actor}"`,
      `"${e.type}"`,
      e.cycle,
      `"${e.summary.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nexus-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50/70">
      <PageHeader
        title="Immutable Audit Trail"
        description="Comprehensive cryptographically-ordered event log of all agent state transitions, tool invocations, and operator approvals."
        icon={<Clock size={18} className="text-blue-600" />}
        actions={
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search audit trail..."
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <button
              onClick={exportCSV}
              disabled={!events || events.length === 0}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-zinc-200/90 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={14} className="text-zinc-500" />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      <div className="max-w-5xl w-full mx-auto p-6 lg:p-8 flex-1">
        {error ? (
          <ErrorState message={`Failed to load audit events: ${error}`} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : (
          <div className="bg-white border border-zinc-200/80 rounded-xl shadow-2xs overflow-hidden">
            {!events ? (
              <TimelineSkeleton />
            ) : filtered.length === 0 ? (
              <div className="p-16 text-center select-none">
                <Radio size={24} className="mx-auto text-zinc-300 mb-2 animate-pulse" />
                <p className="text-sm font-semibold text-zinc-800">
                  {events.length === 0 ? 'No audit events recorded yet.' : 'No audit events match your filter.'}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Trigger any disruption in Scenario Lab to generate verifiable audit entries.
                </p>
              </div>
            ) : (
              <div className="p-6 animate-fade-in">
                <div className="relative border-l-2 border-zinc-100 ml-3 space-y-6">
                  {filtered.map((e) => {
                    const badge = ACTOR_BADGE[e.actor] ?? ACTOR_BADGE.SYSTEM;
                    return (
                      <div key={e.id} className="relative pl-6">
                        <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border-2 border-white bg-blue-600 shadow-2xs"></div>
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-zinc-900 leading-snug">{e.summary}</p>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                              <span className="font-mono text-zinc-700 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200/60">
                                {e.caseId}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded border font-bold text-[10px] uppercase ${badge.bg} ${badge.text} ${badge.border}`}>
                                {e.actor}
                              </span>
                              <span>·</span>
                              <span className="font-mono text-zinc-400">{e.type}</span>
                              <span>·</span>
                              <span className="font-mono text-zinc-400">cycle {e.cycle}</span>
                            </div>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 shrink-0">
                            {e.timestamp.replace('T', ' ').slice(0, 19)} UTC
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}