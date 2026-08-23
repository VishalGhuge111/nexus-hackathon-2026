'use client';

import { CheckCircle2, Cpu, Gavel, ListChecks, Radio, UserCheck } from 'lucide-react';
import { usePolling } from '../../lib/api-client';
import { Skeleton } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import type { AuditEvent } from '@nexus/shared/types/audit';

const TYPE_CONFIG: Record<
  AuditEvent['type'],
  { icon: React.ReactNode; bg: string }
> = {
  STATE_TRANSITION: {
    icon: <Cpu size={13} className="text-blue-600" />,
    bg: 'bg-blue-50 border-blue-100'
  },
  TOOL_CALL: {
    icon: <ListChecks size={13} className="text-zinc-600" />,
    bg: 'bg-zinc-100 border-zinc-200'
  },
  LLM_CALL: {
    icon: <Cpu size={13} className="text-violet-600" />,
    bg: 'bg-violet-50 border-violet-100'
  },
  VALIDATION: {
    icon: <CheckCircle2 size={13} className="text-emerald-600" />,
    bg: 'bg-emerald-50 border-emerald-100'
  },
  HUMAN_ACTION: {
    icon: <Gavel size={13} className="text-amber-700" />,
    bg: 'bg-amber-50 border-amber-200'
  }
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

function FeedSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 py-2.5 border-b border-zinc-100 last:border-0">
          <Skeleton className="mt-0.5 h-7 w-7 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function RecentActivityFeed({ limit = 7 }: { limit?: number }) {
  const { data, isLoading, error, refresh } = usePolling<{ auditEvents: AuditEvent[] }>('/api/audit', 6000);
  const events = (data?.auditEvents ?? []).slice(0, limit);

  if (isLoading && !data) {
    return <FeedSkeleton />;
  }
  if (error && !data) {
    return <ErrorState message={`Failed to load activity: ${error}`} onRetry={() => refresh()} compact />;
  }
  if (events.length === 0) {
    return (
      <div className="py-12 text-center select-none">
        <Radio size={24} className="mx-auto text-zinc-300 mb-2 animate-pulse" />
        <p className="text-sm font-semibold text-zinc-700">Autonomous loop standby</p>
        <p className="text-xs text-zinc-400 mt-0.5">Trigger a disruption scenario to stream live decision events.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {error && (
        <div className="mb-2">
          <ErrorState message={`Live updates interrupted: ${error}`} onRetry={() => refresh()} compact />
        </div>
      )}
      <ul className="divide-y divide-zinc-100">
        {events.map((e) => {
          const meta = TYPE_CONFIG[e.type] ?? {
            icon: <Cpu size={13} className="text-zinc-500" />,
            bg: 'bg-zinc-100 border-zinc-200'
          };

          return (
            <li key={e.id} className="flex items-start gap-3 py-3 transition-colors hover:bg-zinc-50/60 rounded-lg px-2 -mx-2">
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}>
                {meta.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-800 leading-snug line-clamp-2">
                  {e.summary}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                  <span className="font-mono font-medium text-zinc-700 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200/60">
                    {e.caseId}
                  </span>
                  <span>·</span>
                  <span className="capitalize font-medium text-zinc-600">{e.actor.toLowerCase()}</span>
                  <span>·</span>
                  <span className="font-mono">{timeAgo(e.timestamp)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}