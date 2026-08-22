// PRD §28 — "active tool calls streaming in with SUCCESS/FAILURE/NO_DATA badges."
import type { AuditEvent } from "@nexus/shared/types/audit";
import { StatusPill, toolResultTone } from "./StatusPill";

function isToolStatus(value: unknown): value is "SUCCESS" | "FAILURE" | "NO_DATA" {
  return value === "SUCCESS" || value === "FAILURE" || value === "NO_DATA";
}

export function ToolCallFeed({ auditEvents }: { auditEvents: AuditEvent[] }): React.ReactElement {
  const toolCalls = auditEvents.filter((e) => e.type === "TOOL_CALL");

  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Recent tool calls</div>
      <ul className="space-y-1">
        {toolCalls.map((e) => {
          const status = e.detail.status;
          return (
            <li key={e.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono text-slate-300">{String(e.detail.toolName ?? e.summary)}</span>
              {isToolStatus(status) && <StatusPill label={status} tone={toolResultTone(status)} />}
            </li>
          );
        })}
        {toolCalls.length === 0 && <li className="text-xs text-slate-500">No tool calls yet.</li>}
      </ul>
    </div>
  );
}
