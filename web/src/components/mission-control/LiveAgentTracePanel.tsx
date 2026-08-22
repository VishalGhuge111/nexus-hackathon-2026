// PRD §28 — "Center panel — Live agent trace: current operational step
// (highlighted node from Figure 2's state machine, rendered live), active tool
// calls streaming in with SUCCESS/FAILURE/NO_DATA badges."
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
  return (
    <Panel title="Live Agent Trace" subtitle="Figure 2 — Agent Execution FSM (§10)" tone="primary">
      <AgentStateMachine currentStatus={agentState.currentStep} />

      <div className="mt-4 flex items-center gap-6 border-t border-slate-800 pt-3 text-xs text-slate-400">
        <span>
          cycle <span className="font-mono text-slate-200">{agentState.cycle}</span>
        </span>
        <span>
          tool-call budget{" "}
          <span className="font-mono text-slate-200">
            {agentState.toolCallCount}/{MAX_TOOL_CALLS_PER_CASE}
          </span>{" "}
          (§13a)
        </span>
        {agentState.lastLlmModel && (
          <span>
            last LLM <span className="font-mono text-slate-200">{agentState.lastLlmModel}</span>
          </span>
        )}
      </div>

      <div className="mt-3 border-t border-slate-800 pt-3">
        <ToolCallFeed auditEvents={auditEvents} />
      </div>
    </Panel>
  );
}
