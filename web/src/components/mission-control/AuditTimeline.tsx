import type { AuditEvent } from "@nexus/shared/types/audit";
import { StatusPill, auditActorTone } from "./StatusPill";
import { Clock, Cpu, Gavel, Radio } from "lucide-react";

export function AuditTimeline({ auditEvents }: { auditEvents: AuditEvent[] }): React.ReactElement {
  const sorted = [...auditEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
          Case Event Ledger ({sorted.length} events recorded)
        </span>
        <span className="text-[10px] font-mono text-zinc-400">Ordered newest to oldest</span>
      </div>

      {sorted.length === 0 ? (
        <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
          No audit entries recorded for this case.
        </div>
      ) : (
        <div className="relative border-l-2 border-zinc-100 ml-2 space-y-4 max-h-72 overflow-y-auto scroll-thin pr-2">
          {sorted.map((event) => (
            <div key={event.id} className="relative pl-5">
              <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full border border-white bg-blue-600"></div>
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <p className="font-semibold text-zinc-900 leading-snug">{event.summary}</p>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <StatusPill label={event.actor} tone={auditActorTone(event.actor)} />
                    <span className="font-mono">{event.type}</span>
                    <span>·</span>
                    <span className="font-mono">cycle {event.cycle}</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 shrink-0">
                  {event.timestamp.replace("T", " ").slice(11, 19)} UTC
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}