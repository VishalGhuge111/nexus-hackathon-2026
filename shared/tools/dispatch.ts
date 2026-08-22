// PRD §13a — every tool invocation crosses this single guarded choke point:
// budget check -> execute -> increment toolCallCount -> audit write. No tool call
// in the codebase is allowed to bypass this (the FSM never calls a tool primitive
// directly).
import type { Store } from "../db/types";
import type { AgentState } from "../types/agent";
import type { ToolResult } from "../types/tools";
import { MAX_TOOL_CALLS_PER_CASE } from "../config";
import { newId } from "../util/id";

export interface DispatchContext {
  store: Store;
  caseId: string;
  cycle: number;
  agentState: AgentState;
  invokedBy: "AGENT" | "HUMAN";
}

export async function dispatchTool<T>(
  ctx: DispatchContext,
  toolName: string,
  run: () => Promise<ToolResult<T>>
): Promise<ToolResult<T>> {
  if (ctx.agentState.toolCallCount >= MAX_TOOL_CALLS_PER_CASE) {
    await ctx.store.appendAuditEvent({
      id: newId("audit"),
      caseId: ctx.caseId,
      cycle: ctx.cycle,
      timestamp: new Date().toISOString(),
      actor: ctx.invokedBy,
      type: "TOOL_CALL",
      summary: `${toolName} refused: BUDGET_EXHAUSTED`,
      detail: { toolName, refused: "BUDGET_EXHAUSTED", toolCallCount: ctx.agentState.toolCallCount }
    });
    return { toolName, status: "FAILURE", errorReason: "BUDGET_EXHAUSTED", latencyMs: 0 };
  }

  const start = Date.now();
  const result = await run();
  const latencyMs = Date.now() - start;

  ctx.agentState.toolCallCount += 1;
  ctx.agentState.lastToolCalls = [...ctx.agentState.lastToolCalls, toolName];

  await ctx.store.appendAuditEvent({
    id: newId("audit"),
    caseId: ctx.caseId,
    cycle: ctx.cycle,
    timestamp: new Date().toISOString(),
    actor: ctx.invokedBy,
    type: "TOOL_CALL",
    summary: `${toolName} -> ${result.status}`,
    detail: {
      toolName,
      status: result.status,
      errorReason: result.errorReason,
      latencyMs,
      toolCallCount: ctx.agentState.toolCallCount
    }
  });

  return { ...result, latencyMs };
}
