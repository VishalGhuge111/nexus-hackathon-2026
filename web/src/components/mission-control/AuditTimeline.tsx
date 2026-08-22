// PRD §25 — "Every state transition, every tool call..., every LLM invocation...,
// every validator run, and every human action is appended as an immutable
// AuditEvent... The audit trail is the single source the Mission Control
// 'timeline' view renders from — nothing shown in the UI is allowed to exist
// without a corresponding AuditEvent."
import type { AuditEvent } from "@nexus/shared/types/audit";
import { Panel } from "./Panel";
import { StatusPill, toolResultTone } from "./StatusPill";
import { formatTimeUTC } from "@/lib/missionControl/format";

function isToolStatus(value: unknown): value is "SUCCESS" | "FAILURE" | "NO_DATA" {
  return value === "SUCCESS" || value === "FAILURE" || value === "NO_DATA";
}

export function AuditTimeline({ auditEvents }: { auditEvents: AuditEvent[] }): React.ReactElement {
  const chronological = [...auditEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <Panel title="Audit Timeline" subtitle="Gapless chronological event chain — every step, no gaps (§25)">
      <ol className="max-h-80 space-y-1 overflow-y-auto pr-1">
        {chronological.map((event) => (
          <li key={event.id} className="flex items-start gap-2.5 border-b border-slate-900/70 py-2 text-xs">
            <span className="w-20 shrink-0 font-mono text-slate-600">{formatTimeUTC(event.timestamp)} UTC</span>
            <span className="w-8 shrink-0 font-mono text-slate-600">c{event.cycle}</span>
            <span className="w-14 shrink-0 text-slate-600">{event.actor}</span>
            <span className="w-32 shrink-0 font-mono text-slate-500">{event.type}</span>
            <span className="flex-1 text-slate-300">{event.summary}</span>
            {isToolStatus(event.detail.status) && (
              <StatusPill label={event.detail.status} tone={toolResultTone(event.detail.status)} />
            )}
          </li>
        ))}
        {chronological.length === 0 && <li className="text-xs text-slate-500">No audit events yet.</li>}
      </ol>
    </Panel>
  );
}
