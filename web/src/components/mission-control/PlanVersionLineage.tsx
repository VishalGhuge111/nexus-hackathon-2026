import type { RecoveryPlanVersion } from "@nexus/shared/types/procurement";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";
import { GitBranch, Check, X, ArrowDown } from "lucide-react";

export function PlanVersionLineage({
  versions
}: {
  versions: (RecoveryPlanVersion & { id: string })[];
}): React.ReactElement {
  const sorted = [...versions].sort((a, b) => a.version - b.version);

  return (
    <Panel
      title="Plan Version Lineage (State Preservation)"
      subtitle="Autonomous replanning preserves verified state without restarting the search space"
    >
      <div className="space-y-3">
        {sorted.map((version, i) => {
          const isActive = version.status === "ACTIVE";
          const isSuperseded = version.status === "SUPERSEDED";

          return (
            <div key={version.id}>
              {i > 0 && (
                <div className="flex items-center gap-2 py-2 pl-4 text-xs text-zinc-400">
                  <ArrowDown size={13} className="text-zinc-400" />
                  <span className="font-semibold text-blue-600 text-[11px] uppercase tracking-wider">
                    Autonomous Replan Triggered
                  </span>
                </div>
              )}
              <div
                className={`rounded-xl border p-4 text-xs transition-all ${
                  isActive
                    ? "border-blue-300 bg-blue-50/40 ring-1 ring-blue-200"
                    : isSuperseded
                    ? "border-zinc-200 bg-zinc-50/60 opacity-80"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-bold text-sm ${
                        isSuperseded ? "text-zinc-500 line-through decoration-zinc-300" : "text-zinc-900"
                      }`}
                    >
                      Plan Version V{version.version}
                    </span>
                    {version.parent_version !== null && (
                      <span className="font-mono text-[10px] text-zinc-400">
                        (Derived from V{version.parent_version})
                      </span>
                    )}
                  </div>
                  <StatusPill
                    label={version.status}
                    dot={isActive}
                    tone={isActive ? "info" : "neutral"}
                  />
                </div>

                <div className="space-y-1.5 mb-3 text-xs">
                  <p className="text-zinc-600">
                    <strong className="text-zinc-800">Reason for Change:</strong> {version.reason_for_change}
                  </p>
                  <p className="text-zinc-400 font-mono text-[11px]">
                    Triggering Event: {version.triggering_event}
                  </p>
                </div>

                {version.invalidated_assumptions.length > 0 && (
                  <div className="mb-2 bg-red-50/80 p-2.5 rounded-lg border border-red-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1 flex items-center gap-1">
                      <X size={12} /> Invalidated Assumptions (Excluded)
                    </div>
                    <ul className="list-inside list-disc text-[11px] text-red-700/90 space-y-0.5">
                      {version.invalidated_assumptions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {version.carried_forward_actions.length > 0 && (
                  <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1">
                      <Check size={12} /> Carried-Forward Verified Actions
                    </div>
                    <ul className="list-inside list-disc text-[11px] text-emerald-800/90 space-y-0.5">
                      {version.carried_forward_actions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}