'use client';

// Real cross-case activity feed — GET /api/audit (shared/db Store, every
// AuditEvent the FSM has actually written). Replaces the old DynamicIsland's
// scripted "Analyzing telemetry stream..." theater with the genuine log.
import { CheckCircle2, Cpu, Gavel, ListChecks } from 'lucide-react';
import { usePolling } from '../../lib/api-client';
import type { AuditEvent } from '@nexus/shared/types/audit';

const TYPE_ICON: Record<AuditEvent['type'], React.ReactNode> = {
  STATE_TRANSITION: <Cpu size={14} className="text-sky-500" />,
  TOOL_CALL: <ListChecks size={14} className="text-zinc-400" />,
  LLM_CALL: <Cpu size={14} className="text-violet-500" />,
  VALIDATION: <CheckCircle2 size={14} className="text-amber-500" />,
  HUMAN_ACTION: <Gavel size={14} className="text-emerald-600" />
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function RecentActivityFeed({ limit = 8 }: { limit?: number }) {
  const { data, isLoading, error } = usePolling<{ auditEvents: AuditEvent[] }>('/api/audit', 8000);
  const events = (data?.auditEvents ?? []).slice(0, limit);

  if (isLoading && !data) {
    return <div className="py-8 text-center text-sm text-zinc-400">Loading activity…</div>;
  }
  if (error) {
    return <div className="py-8 text-center text-sm text-red-500">Failed to load activity: {error}</div>;
  }
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-400">
        No agent activity yet. Trigger a disruption to see the agent respond in real time.
      </div>
    );
  }

  return (
    <ul className="space-y-0.5">
      {events.map((e) => (
        <li key={e.id} className="flex items-start gap-2.5 py-2 border-b border-zinc-100 last:border-0 text-xs">
          <span className="mt-0.5 shrink-0">{TYPE_ICON[e.type]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-zinc-700 truncate">{e.summary}</p>
            <p className="text-zinc-400 mt-0.5">
              <span className="font-mono">{e.caseId}</span> &middot; {e.actor} &middot; {timeAgo(e.timestamp)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
