import type { AuditEvent } from "@nexus/shared/types/audit";
import { StatusPill, toolStatusTone } from "./StatusPill";
import { toolCallLabel } from "@/lib/missionControl/format";

function isToolStatus(value: unknown): value is "SUCCESS" | "FAILURE" | "NO_DATA" {
  return value === "SUCCESS" || value === "FAILURE" || value === "NO_DATA";
}

export function ToolCallFeed({ auditEvents }: { auditEvents: AuditEvent[] }): React.ReactElement {
  const toolCalls = auditEvents.filter((e) => e.type === "TOOL_CALL");

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
          Autonomous Tool Invocations ({toolCalls.length})
        </div>
        <span className="text-[10px] text-zinc-400 font-mono">Streaming Telemetry</span>
      </div>

      {toolCalls.length === 0 ? (
        <div className="py-4 text-center text-xs text-zinc-400 bg-zinc-50/50 rounded-lg border border-dashed border-zinc-200">
          No tool calls executed in current cycle.
        </div>
      ) : (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto scroll-thin">
          {toolCalls.map((e) => {
            const rawStatus = e.detail?.status;
            const status: "SUCCESS" | "FAILURE" | "NO_DATA" = isToolStatus(rawStatus) ? rawStatus : "SUCCESS";
            const toolName = e.detail?.toolName ? String(e.detail.toolName) : null;
            const duration = typeof e.detail?.durationMs === "number" ? e.detail.durationMs : null;

            return (
              <li
                key={e.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/60 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-zinc-800 truncate">
                    {toolName ? toolCallLabel(toolName) : e.summary}
                  </span>
                  {toolName && (
                    <span className="font-mono text-[10px] text-zinc-400 bg-zinc-100 px-1 rounded">
                      {toolName}
                    </span>
                  )}
                  {duration !== null && (
                    <span className="font-mono text-[10px] text-zinc-400">{duration}ms</span>
                  )}
                </div>
                <StatusPill label={status} tone={toolStatusTone(status)} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}