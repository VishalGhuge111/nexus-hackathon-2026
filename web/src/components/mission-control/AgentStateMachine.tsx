import type { CaseStatus } from "@nexus/shared/types/case";

const MAIN_PATH: { id: CaseStatus; label: string }[] = [
  { id: "MONITORING", label: "1. Monitoring" },
  { id: "EARLY_RISK_CHECK", label: "2. Early Risk" },
  { id: "VERIFY", label: "3. Verify Signal" },
  { id: "PLAN", label: "4. Synthesize Plan" },
  { id: "VALIDATE", label: "5. Validate Constraints" },
  { id: "EXECUTE_OR_ESCALATE", label: "6. Governance Check" },
  { id: "VERIFY_OUTCOME", label: "7. Verify Outcome" },
  { id: "GOAL_ACHIEVED", label: "8. Goal Achieved" }
];

const BRANCH_NODES: { id: CaseStatus; title: string; desc: string }[] = [
  {
    id: "ADAPT_REPLAN",
    title: "Adaptive Replanning Loop",
    desc: "If initial plan fails any constraint, triggers autonomous multi-supplier replan (V1 → V2)"
  },
  {
    id: "HUMAN_ESCALATED_AWAITING_DECISION",
    title: "Governance Escalation Gate",
    desc: "Pauses execution if emergency spend exceeds ₹10,000 policy threshold until human sign-off"
  },
  {
    id: "NO_FEASIBLE_RECOVERY",
    title: "Terminal Exception Handler",
    desc: "Alerts executive team if no qualified supplier can meet the hard delivery deadline"
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
  return "border-zinc-200 bg-zinc-50 text-zinc-500 font-normal";
}

export function AgentStateMachine({ currentStatus }: { currentStatus: CaseStatus }): React.ReactElement {
  const currentIndex = MAIN_PATH.findIndex((m) => m.id === currentStatus);

  return (
    <div className="select-none">
      <div className="flex flex-wrap items-center gap-1.5">
        {MAIN_PATH.map((node, i) => {
          const isCurrent = node.id === currentStatus;
          const isCompleted = !isCurrent && currentIndex !== -1 && i < currentIndex;
          return (
            <div key={node.id} className="flex items-center gap-1.5">
              <div
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${nodeClasses(
                  isCurrent,
                  isCompleted,
                  node.id === "GOAL_ACHIEVED",
                  false
                )}`}
              >
                {isCompleted && <span className="mr-1 text-emerald-600 font-bold">✓</span>}
                <span>{node.label}</span>
                {isCurrent && <span className="ml-1.5 text-blue-600 font-bold">● active</span>}
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

      <div className="mt-3.5 space-y-2 border-t border-zinc-100 pt-3">
        <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
          Autonomous Safety & Governance Rules
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {BRANCH_NODES.map((branch) => {
            const isCurrent = branch.id === currentStatus;
            return (
              <div
                key={branch.id}
                className={`p-2 rounded-lg border text-xs flex items-start gap-2.5 ${
                  isCurrent
                    ? "bg-blue-50/70 border-blue-200"
                    : "bg-zinc-50/60 border-zinc-100 text-zinc-600"
                }`}
              >
                <span className="font-bold text-zinc-900 shrink-0 text-[11px]">
                  {branch.title}:
                </span>
                <span className="text-zinc-600 text-[11px] leading-tight">
                  {branch.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}