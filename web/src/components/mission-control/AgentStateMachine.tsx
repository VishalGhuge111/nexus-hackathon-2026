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

function nodeClasses(isCurrent: boolean, isCompleted: boolean, isTerminalGood: boolean, isTerminalBad: boolean): string {
  if (isCurrent) return "border-sky-500 bg-sky-950 text-sky-200 ring-2 ring-sky-500/40";
  if (isCompleted && isTerminalGood) return "border-emerald-700 bg-emerald-950/50 text-emerald-300";
  if (isCompleted) return "border-emerald-900/60 bg-emerald-950/20 text-emerald-500/80";
  if (isTerminalBad) return "border-red-900 bg-red-950/30 text-red-400";
  return "border-slate-800 bg-slate-900/60 text-slate-500";
}

export function AgentStateMachine({ currentStatus }: { currentStatus: CaseStatus }): React.ReactElement {
  // A step already passed through reads as "done" (muted emerald) rather than
  // identical to a step never reached yet (dim slate) — the whole point of a
  // pipeline view is to show progress, not just a static diagram with one dot
  // lit up. MONITORING/EARLY_RISK_CHECK have no live equivalent in this
  // reactive event-driven slice (case creation starts the case straight at
  // VERIFY), so they only ever render as "not reached" or, once the case has
  // moved on, implicitly completed.
  const currentIndex = MAIN_PATH.indexOf(currentStatus);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {MAIN_PATH.map((status, i) => {
          const isCurrent = status === currentStatus;
          const isCompleted = !isCurrent && currentIndex !== -1 && i < currentIndex;
          return (
            <div key={status} className="flex items-center gap-2">
              <div
                className={`rounded border px-2.5 py-1.5 font-mono text-xs font-medium ${nodeClasses(
                  isCurrent,
                  isCompleted,
                  status === "GOAL_ACHIEVED",
                  false
                )}`}
              >
                {isCompleted && <span className="mr-1 text-emerald-500">✓</span>}
                {status.replace(/_/g, " ")}
                {isCurrent && <span className="ml-1.5 text-sky-400">● live</span>}
              </div>
              {i < MAIN_PATH.length - 1 && (
                <span className={isCompleted ? "text-emerald-800" : "text-slate-700"}>&rarr;</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 space-y-1.5 border-t border-slate-800 pt-3">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">Branches</div>
        {BRANCH_NODES.map((branch) => (
          <div key={branch.id} className="flex items-start gap-2 text-xs">
            <div
              className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[11px] font-medium ${nodeClasses(
                branch.id === currentStatus,
                false,
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
