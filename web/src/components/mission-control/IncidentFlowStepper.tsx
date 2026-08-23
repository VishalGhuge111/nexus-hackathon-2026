export type FlowStepState = "done" | "current" | "pending";

export interface FlowStep {
  key: string;
  label: string;
  state: FlowStepState;
  note?: string;
}

function nodeClasses(state: FlowStepState): string {
  if (state === "done") return "bg-emerald-600 text-white shadow-2xs";
  if (state === "current") return "bg-blue-600 text-white ring-4 ring-blue-100 shadow-2xs";
  return "bg-zinc-100 text-zinc-400 border border-zinc-200/80";
}

function labelClasses(state: FlowStepState): string {
  if (state === "done") return "text-zinc-800 font-semibold";
  if (state === "current") return "text-blue-700 font-bold";
  return "text-zinc-400 font-medium";
}

export function IncidentFlowStepper({ steps }: { steps: FlowStep[] }): React.ReactElement {
  return (
    <div className="flex items-center gap-0 overflow-x-auto rounded-xl border border-zinc-200/80 bg-white px-5 py-3.5 shadow-2xs scroll-thin select-none">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold font-mono transition-colors ${nodeClasses(
                step.state
              )}`}
            >
              {step.state === "done" ? "✓" : i + 1}
            </span>
            <div className="leading-tight">
              <div className={`text-xs ${labelClasses(step.state)}`}>{step.label}</div>
              {step.note && <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{step.note}</div>}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mx-3.5 h-0.5 w-8 shrink-0 sm:w-10 rounded-full transition-colors ${
                step.state === "done" ? "bg-emerald-400" : "bg-zinc-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}