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

// Left-edge accent per AuditEvent.type — lets a judge scan the shape of a run
// (state changes vs. tool calls vs. the one human action) without reading
// every row's text first. Purely a display grouping; no new data.
const TYPE_ACCENT: Record<AuditEvent["type"], string> = {
  STATE_TRANSITION: "border-l-sky-600",
  TOOL_CALL: "border-l-slate-700",
  LLM_CALL: "border-l-violet-600",
  VALIDATION: "border-l-amber-600",
  HUMAN_ACTION: "border-l-emerald-600"
};

export function AuditTimeline({ auditEvents }: { auditEvents: AuditEvent[] }): React.ReactElement {
  const chronological = [...auditEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <Panel title="Audit Timeline" subtitle="Gapless chronological event chain — every step, no gaps (§25)">
      <ol className="scroll-thin max-h-80 space-y-1 overflow-y-auto pr-1">
        {chronological.map((event) => (
          <li
            key={event.id}
            className={`flex items-start gap-2.5 border-b border-l-2 border-b-slate-900/70 py-2 pl-2.5 text-xs ${TYPE_ACCENT[event.type]}`}
          >
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
