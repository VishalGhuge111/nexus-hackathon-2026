import type { AgentState } from "@nexus/shared/types/agent";
import type { AuditEvent } from "@nexus/shared/types/audit";
import { Panel } from "./Panel";
import { AgentStateMachine } from "./AgentStateMachine";
import { ToolCallFeed } from "./ToolCallFeed";
import { MAX_TOOL_CALLS_PER_CASE } from "@nexus/shared/config";

export function LiveAgentTracePanel({
  agentState,
  auditEvents
}: {
  agentState: AgentState;
  auditEvents: AuditEvent[];
}): React.ReactElement {
  const toolCallsUsed = agentState.toolCallCount ?? 0;
  const toolPct = Math.min(100, Math.round((toolCallsUsed / MAX_TOOL_CALLS_PER_CASE) * 100));

  return (
    <Panel
      title="Live Agent Execution Trace"
      subtitle="Autonomous state machine progression with deterministic budget constraints"
      tone="primary"
    >
      <AgentStateMachine currentStatus={agentState.currentStep} />

      {/* Governance & Budget Status */}
      <div className="mt-4 flex items-center justify-between flex-wrap gap-3 border-t border-zinc-100 pt-3 text-xs text-zinc-500 bg-zinc-50/70 p-2.5 rounded-lg">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">Cycle:</span>
          <span className="font-mono font-bold text-zinc-800">{agentState.cycle}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Tool Call Budget:</span>
          <span className="font-mono font-bold text-zinc-800">
            {toolCallsUsed}/{MAX_TOOL_CALLS_PER_CASE}
          </span>
          <div className="w-16 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${toolPct}%` }}></div>
          </div>
        </div>

        {agentState.lastLlmModel && (
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">LLM Adapter:</span>
            <span className="font-mono font-medium text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100 text-[11px]">
              {agentState.lastLlmModel}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3.5 border-t border-zinc-100 pt-3">
        <ToolCallFeed auditEvents={auditEvents} />
      </div>
    </Panel>
  );
}