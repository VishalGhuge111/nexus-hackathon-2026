'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Clock, Search, Download, Radio, Cpu, UserCheck, Activity, Copy, Check } from 'lucide-react';
import { fetchAllAuditEvents } from '../../lib/api-client';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import type { AuditEvent } from '@nexus/shared/types/audit';

const ACTOR_CONFIG: Record<
  AuditEvent['actor'],
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  AGENT: {
    label: 'Agent',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <Cpu size={12} className="text-blue-600" />
  },
  HUMAN: {
    label: 'Human',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: <UserCheck size={12} className="text-amber-700" />
  },
  SYSTEM: {
    label: 'System',
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-200',
    icon: <Radio size={12} className="text-zinc-600" />
  }
};

function TimelineSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4 border border-zinc-100 rounded-xl">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
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
  const [actorFilter, setActorFilter] = useState<'ALL' | 'AGENT' | 'HUMAN' | 'SYSTEM'>('ALL');
  const [reloadKey, setReloadKey] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    if (actorFilter !== 'ALL' && e.actor !== actorFilter) return false;
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

  const copyCaseId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50/70">
      <PageHeader
        title="Immutable Audit Trail"
        description="Comprehensive cryptographically-ordered event log of all agent state transitions, tool invocations, and operator approvals."
        icon={<Clock size={18} className="text-blue-600" />}
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search audit ledger..."
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <button
              onClick={exportCSV}
              disabled={!events || events.length === 0}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={13} className="text-zinc-500" />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      <div className="max-w-6xl w-full mx-auto p-6 lg:p-8 space-y-4 flex-1">
        {/* Filter bar for Actor */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Filter Actor:</span>
            <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70 text-xs">
              {(['ALL', 'AGENT', 'HUMAN', 'SYSTEM'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setActorFilter(a)}
                  className={`cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    actorFilter === a
                      ? 'bg-white text-zinc-900 shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {filtered.length} of {events?.length ?? 0} verifiable event(s)
          </span>
        </div>

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
              <div className="p-5 animate-fade-in divide-y divide-zinc-100">
                {filtered.map((e) => {
                  const actorMeta = ACTOR_CONFIG[e.actor] ?? ACTOR_CONFIG.SYSTEM;
                  return (
                    <div key={e.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3.5 group">
                      <div
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${actorMeta.bg} ${actorMeta.border}`}
                      >
                        {actorMeta.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3 flex-wrap">
                          <p className="text-xs font-bold text-zinc-900 leading-snug break-words">
                            {e.summary}
                          </p>
                          <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                            {e.timestamp.replace('T', ' ').slice(0, 19)} UTC
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-500 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded border font-bold text-[10px] uppercase ${actorMeta.bg} ${actorMeta.text} ${actorMeta.border}`}
                          >
                            {actorMeta.label}
                          </span>
                          <span className="font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200/60 text-[10px]">
                            {e.type}
                          </span>
                          <span className="font-mono text-zinc-400 text-[10px]">
                            cycle {e.cycle}
                          </span>
                          <span>·</span>
                          <button
                            onClick={() => copyCaseId(e.caseId)}
                            className="cursor-pointer inline-flex items-center gap-1 font-mono text-zinc-600 bg-zinc-50 hover:bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200/60 transition-colors text-[10px]"
                            title="Click to copy Case ID"
                          >
                            <span>{e.caseId}</span>
                            {copiedId === e.caseId ? (
                              <Check size={10} className="text-emerald-600" />
                            ) : (
                              <Copy size={10} className="text-zinc-400 opacity-60 group-hover:opacity-100" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}