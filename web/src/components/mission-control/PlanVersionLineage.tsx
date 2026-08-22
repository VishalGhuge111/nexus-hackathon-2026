// PRD §23, Figure 3 (fig3_v1_v2_replanning) — "show a judge, at a glance, that
// replanning preserves state rather than restarting. V2 explicitly states what
// from V1 is still trusted (carried_forward_actions) and what's been thrown out
// (invalidated_assumptions), with a named reason."
import type { RecoveryPlanVersion } from "@nexus/shared/types/procurement";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";

export function PlanVersionLineage({ versions }: { versions: RecoveryPlanVersion[] }): React.ReactElement {
  const sorted = [...versions].sort((a, b) => a.version - b.version);

  return (
    <Panel title="Plan Version Lineage (V1 → V2)" subtitle="Replanning preserves state — nothing restarts from scratch (§23)">
      <div className="space-y-4">
        {sorted.map((version) => (
          <div key={version.version} className="rounded border border-slate-800 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-sm text-slate-200">
                V{version.version}
                {version.parent_version !== null && (
                  <span className="ml-2 text-xs text-slate-500">parent V{version.parent_version}</span>
                )}
              </span>
              <StatusPill label={version.status} tone={version.status === "ACTIVE" ? "info" : "neutral"} />
            </div>

            <p className="mb-2 text-xs text-slate-400">
              <span className="text-slate-500">reason_for_change:</span> {version.reason_for_change}
            </p>
            <p className="mb-2 text-xs text-slate-500">
              <span className="text-slate-500">triggering_event:</span> {version.triggering_event}
            </p>

            {version.invalidated_assumptions.length > 0 && (
              <div className="mb-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-red-400">
                  Invalidated assumptions
                </div>
                <ul className="mt-1 list-inside list-disc text-xs text-red-300/90">
                  {version.invalidated_assumptions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {version.carried_forward_actions.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                  Carried-forward actions
                </div>
                <ul className="mt-1 list-inside list-disc text-xs text-emerald-300/90">
                  {version.carried_forward_actions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {version.invalidated_assumptions.length === 0 && version.carried_forward_actions.length === 0 && (
              <p className="text-xs text-slate-600">Initial proposal — no prior version to carry forward or invalidate.</p>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
