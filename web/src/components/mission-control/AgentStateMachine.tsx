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
  {
    id: "ADAPT_REPLAN",
    edge: "VALIDATE constraint failure or unmet outcome → trigger ADAPT_REPLAN → loop to PLAN (V2, V3…)"
  },
  {
    id: "HUMAN_ESCALATED_AWAITING_DECISION",
    edge: "EXECUTE_OR_ESCALATE: cost exceeds ₹10,000 threshold or policy flag → awaiting human decision"
  },
  {
    id: "NO_FEASIBLE_RECOVERY",
    edge: "ADAPT_REPLAN: no supplier or plan satisfies constraints after maximum replan attempts"
  }
];

function nodeClasses(
  isCurrent: boolean,
  isCompleted: boolean,
  isTerminalGood: boolean,
  isTerminalBad: boolean
): string {
  if (isCurrent) return "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200 font-bold";
  if (isCompleted && isTerminalGood) return "border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold";
  if (isCompleted) return "border-emerald-200 bg-emerald-50/70 text-emerald-700 font-medium";
  if (isTerminalBad) return "border-red-300 bg-red-50 text-red-700 font-semibold";
  return "border-zinc-200 bg-zinc-50/80 text-zinc-400 font-normal";
}

export function AgentStateMachine({ currentStatus }: { currentStatus: CaseStatus }): React.ReactElement {
  const currentIndex = MAIN_PATH.indexOf(currentStatus);
  return (
    <div className="select-none">
      <div className="flex flex-wrap items-center gap-1.5">
        {MAIN_PATH.map((status, i) => {
          const isCurrent = status === currentStatus;
          const isCompleted = !isCurrent && currentIndex !== -1 && i < currentIndex;
          return (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className={`rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${nodeClasses(
                  isCurrent,
                  isCompleted,
                  status === "GOAL_ACHIEVED",
                  false
                )}`}
              >
                {isCompleted && <span className="mr-1 text-emerald-600 font-bold">✓</span>}
                {status.replace(/_/g, " ")}
                {isCurrent && <span className="ml-1.5 text-blue-600 font-bold">● live</span>}
              </div>
              {i < MAIN_PATH.length - 1 && (
                <span className={`text-xs ${isCompleted ? "text-emerald-400 font-bold" : "text-zinc-300"}`}>
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3.5 space-y-1.5 border-t border-zinc-100 pt-3">
        <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
          Conditional FSM Branching Rules
        </div>
        {BRANCH_NODES.map((branch) => {
          const isCurrent = branch.id === currentStatus;
          return (
            <div key={branch.id} className="flex items-start gap-2 text-xs">
              <div
                className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${nodeClasses(
                  isCurrent,
                  false,
                  false,
                  branch.id === "NO_FEASIBLE_RECOVERY"
                )}`}
              >
                {branch.id.replace(/_/g, " ")}
                {isCurrent && <span className="ml-1 text-blue-600">● live</span>}
              </div>
              <p className="text-zinc-500 text-[11px] leading-tight">{branch.edge}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}