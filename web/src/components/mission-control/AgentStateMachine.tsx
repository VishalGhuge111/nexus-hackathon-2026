// PRD §10, Figure 2 (fig2_agent_execution_loop) — the exact sequence of states a
// Case moves through. Rendered as a static pipeline (no animation) with the
// current node highlighted; branch nodes are shown separately with the
// condition that selects them, matching the diagram's own labeled edges.
import type { CaseStatus } from "@nexus/shared/types/case";

const MAIN_PATH: CaseStatus[] = [
  "MONITORING",
  "EARLY_RISK_CHECK",
  "VERIFY",
  "PLAN",
  "VALIDATE",
  "EXECUTE_OR_ESCALATE",
  "VERIFY_OUTCOME",
  "GOAL_ACHIEVED"
];

const BRANCH_NODES: { id: CaseStatus; edge: string }[] = [
  { id: "ADAPT_REPLAN", edge: "VALIDATE fails constraint, or VERIFY_OUTCOME shows the goal unmet → ADAPT_REPLAN → back to PLAN (V2, V3…)" },
  { id: "HUMAN_ESCALATED_AWAITING_DECISION", edge: "EXECUTE_OR_ESCALATE: exceeds approval threshold / policy flag → awaiting human decision" },
  { id: "NO_FEASIBLE_RECOVERY", edge: "ADAPT_REPLAN: no supplier/plan satisfies constraints after the replan cap" }
];

function nodeClasses(isCurrent: boolean, isTerminalGood: boolean, isTerminalBad: boolean): string {
  if (isCurrent) return "border-sky-500 bg-sky-950 text-sky-200 ring-1 ring-sky-500";
  if (isTerminalGood) return "border-emerald-800 bg-emerald-950/40 text-emerald-400";
  if (isTerminalBad) return "border-red-900 bg-red-950/30 text-red-400";
  return "border-slate-800 bg-slate-900/60 text-slate-400";
}

export function AgentStateMachine({ currentStatus }: { currentStatus: CaseStatus }): React.ReactElement {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {MAIN_PATH.map((status, i) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className={`rounded border px-2.5 py-1.5 font-mono text-xs font-medium ${nodeClasses(
                status === currentStatus,
                status === "GOAL_ACHIEVED",
                false
              )}`}
            >
              {status.replace(/_/g, " ")}
              {status === currentStatus && <span className="ml-1.5 text-sky-400">● live</span>}
            </div>
            {i < MAIN_PATH.length - 1 && <span className="text-slate-700">&rarr;</span>}
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1.5 border-t border-slate-800 pt-3">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">Branches</div>
        {BRANCH_NODES.map((branch) => (
          <div key={branch.id} className="flex items-start gap-2 text-xs">
            <div
              className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[11px] font-medium ${nodeClasses(
                branch.id === currentStatus,
                false,
                branch.id === "NO_FEASIBLE_RECOVERY"
              )}`}
            >
              {branch.id.replace(/_/g, " ")}
              {branch.id === currentStatus && <span className="ml-1.5 text-sky-400">● live</span>}
            </div>
            <p className="text-slate-500">{branch.edge}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
