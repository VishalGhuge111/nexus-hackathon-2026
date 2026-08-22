// PRD §23, Figure 3 (fig3_v1_v2_replanning) — "show a judge, at a glance, that
// replanning preserves state rather than restarting. V2 explicitly states what
// from V1 is still trusted (carried_forward_actions) and what's been thrown out
// (invalidated_assumptions), with a named reason."
import type { RecoveryPlanVersion } from "@nexus/shared/types/procurement";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";

export function PlanVersionLineage({
  versions
}: {
  // Both call sites (the live /api/cases/:id route via store.listPlanVersions,
  // and the static demo fixture) already carry a genuinely unique `id` on every
  // record — the shared RecoveryPlanVersion domain type itself has no id field
  // (persistence identity is a Store-layer concern, not a PRD domain concept),
  // so this prop type declares what's actually passed in rather than the
  // narrower domain type, which was silently discarding `id` and forcing the
  // component to key by the numeric `version` instead (not guaranteed unique —
  // see the React key below).
  versions: (RecoveryPlanVersion & { id: string })[];
}): React.ReactElement {
  const sorted = [...versions].sort((a, b) => a.version - b.version);

  return (
    <Panel title="Plan Version Lineage (V1 → V2)" subtitle="Replanning preserves state — nothing restarts from scratch (§23)">
      <div>
        {sorted.map((version, i) => {
          const isActive = version.status === "ACTIVE";
          const isSuperseded = version.status === "SUPERSEDED";
          return (
            <div key={version.id}>
              {i > 0 && (
                <div className="flex items-center gap-2 py-1.5 pl-2 text-[11px] text-zinc-400">
                  <span className="font-mono text-sm leading-none text-zinc-300">&darr;</span>
                  <span>replanned</span>
                </div>
              )}
              <div
                className={`rounded-lg border p-3 ${
                  isActive ? "border-sky-200 bg-sky-50" : isSuperseded ? "border-zinc-200 bg-zinc-50 opacity-70" : "border-zinc-200"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={`font-mono text-sm ${isSuperseded ? "text-zinc-400 line-through decoration-zinc-300" : "text-zinc-800"}`}>
                    V{version.version}
                    {version.parent_version !== null && (
                      <span className="ml-2 font-sans text-xs text-zinc-400 no-underline">parent V{version.parent_version}</span>
                    )}
                  </span>
                  <StatusPill label={version.status} dot={isActive} tone={isActive ? "info" : "neutral"} />
                </div>

                <p className="mb-2 text-xs text-zinc-500">
                  <span className="text-zinc-400">reason_for_change:</span> {version.reason_for_change}
                </p>
                <p className="mb-2 text-xs text-zinc-400">
                  <span className="text-zinc-400">triggering_event:</span> {version.triggering_event}
                </p>

                {version.invalidated_assumptions.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[11px] font-semibold tracking-wide text-red-600 uppercase">Invalidated assumptions</div>
                    <ul className="mt-1 list-inside list-disc text-xs text-red-600/90">
                      {version.invalidated_assumptions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {version.carried_forward_actions.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold tracking-wide text-emerald-600 uppercase">Carried-forward actions</div>
                    <ul className="mt-1 list-inside list-disc text-xs text-emerald-600/90">
                      {version.carried_forward_actions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {version.invalidated_assumptions.length === 0 && version.carried_forward_actions.length === 0 && (
                  <p className="text-xs text-zinc-400">Initial proposal — no prior version to carry forward or invalidate.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
