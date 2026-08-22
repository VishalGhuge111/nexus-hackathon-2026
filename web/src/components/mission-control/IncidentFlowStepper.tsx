// Compact narrative rail across the top of a live case: Risk -> Agent -> Plan ->
// Validate -> Approval -> Outcome (PRD Figure 1/§21 boundary, §10 FSM). Gives a
// judge the PS's end-to-end shape in one glance before reading the panels below.
export type FlowStepState = "done" | "current" | "pending";

export interface FlowStep {
  key: string;
  label: string;
  state: FlowStepState;
  note?: string;
}

function nodeClasses(state: FlowStepState): string {
  if (state === "done") return "bg-emerald-500 text-white";
  if (state === "current") return "bg-sky-500 text-white ring-4 ring-sky-100";
  return "bg-white text-zinc-300 border border-zinc-200";
}

function labelClasses(state: FlowStepState): string {
  if (state === "done") return "text-zinc-700";
  if (state === "current") return "text-sky-700";
  return "text-zinc-400";
}

export function IncidentFlowStepper({ steps }: { steps: FlowStep[] }): React.ReactElement {
  return (
    <div className="flex items-center gap-0 overflow-x-auto rounded-xl border border-zinc-200 bg-white px-5 py-4">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${nodeClasses(step.state)}`}>
              {step.state === "done" ? "✓" : i + 1}
            </span>
            <div className="leading-tight">
              <div className={`text-xs font-semibold ${labelClasses(step.state)}`}>{step.label}</div>
              {step.note && <div className="text-[10px] text-zinc-400">{step.note}</div>}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className={`mx-3.5 h-px w-8 shrink-0 sm:w-12 ${step.state === "done" ? "bg-emerald-300" : "bg-zinc-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
