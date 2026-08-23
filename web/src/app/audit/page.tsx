'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Activity, Download, Search } from 'lucide-react';
import { fetchAllAuditEvents } from '../../lib/api-client';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import type { AuditEvent } from '@nexus/shared/types/audit';

const ACTOR_DOT: Record<AuditEvent['actor'], string> = {
  AGENT: 'bg-blue-500',
  HUMAN: 'bg-emerald-500',
  SYSTEM: 'bg-zinc-400'
};

function toCsv(events: AuditEvent[]): string {
  const header = 'id,timestamp,caseId,cycle,actor,type,summary';
  const rows = events.map((e) =>
    [e.id, e.timestamp, e.caseId, e.cycle, e.actor, e.type, `"${e.summary.replace(/"/g, '""')}"`].join(',')
  );
  return [header, ...rows].join('\n');
}

function TimelineSkeleton() {
  return (
    <div className="p-6">
      <div className="relative border-l-2 border-zinc-100 ml-3 space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="relative pl-6">
            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white bg-zinc-200" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-3 w-32 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchAllAuditEvents()
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const list = events ?? [];
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (e) =>
        e.summary.toLowerCase().includes(term) ||
        e.caseId.toLowerCase().includes(term) ||
        e.actor.toLowerCase().includes(term) ||
        e.type.toLowerCase().includes(term)
    );
  }, [events, searchTerm]);

  function handleExport() {
    if (!events || events.length === 0) return;
    const blob = new Blob([toCsv(events)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50">
      <PageHeader
        title="Audit Trail"
        description="Every real AuditEvent the agent has written, across all cases (PRD §25)."
        icon={<Activity size={20} className="text-blue-600" />}
        actions={
          <button
            onClick={handleExport}
            disabled={!events || events.length === 0}
            className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} /> Export CSV
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {error ? (
            <ErrorState message={`Failed to load audit log: ${error}`} onRetry={() => setReloadKey((k) => k + 1)} />
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter by case, actor, type, or text..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <span className="text-xs text-zinc-400">
                  {events ? `${filtered.length} event${filtered.length === 1 ? '' : 's'}` : '—'}
                </span>
              </div>

              {!events ? (
                <TimelineSkeleton />
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-sm text-zinc-500">
                  {events.length === 0 ? 'No audit events yet — trigger a disruption to generate real activity.' : 'No events match this filter.'}
                </div>
              ) : (
                <div className="p-6 animate-fade-in">
                  <div className="relative border-l-2 border-zinc-100 ml-3 space-y-6">
                    {filtered.map((e) => (
                      <div key={e.id} className="relative pl-6">
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${ACTOR_DOT[e.actor]}`}></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{e.summary}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              <span className="font-mono text-zinc-700 bg-zinc-100 px-1 py-0.5 rounded">{e.caseId}</span>
                              {' '}&middot; {e.actor} &middot; {e.type} &middot; cycle {e.cycle}
                            </p>
                          </div>
                          <div className="text-xs font-mono text-zinc-400 shrink-0">{e.timestamp.replace('T', ' ').slice(0, 19)} UTC</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
