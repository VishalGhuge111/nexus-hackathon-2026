// PRD §30 — "Do-Nothing vs NEXUS Plan... both computed by the same deterministic
// formulas run under two scenarios... must never be hand-wavy text, only the two
// computed scenarios side by side."
import { formatINR } from "@/lib/missionControl/format";

export interface ScenarioResult {
  coverageDays: number | null;
  deadlineBreached: boolean;
  unitsAtRisk: number;
  costImpact: number;
}

export function DoNothingVsNexus({
  doNothing,
  nexusPlan
}: {
  doNothing: ScenarioResult;
  nexusPlan: ScenarioResult;
}): React.ReactElement {
  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-wide text-zinc-400">Do-Nothing vs NEXUS Plan (§30)</div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-zinc-400">
            <th className="pb-1 font-normal"></th>
            <th className="pb-1 font-normal">Do Nothing</th>
            <th className="pb-1 font-normal">NEXUS Plan</th>
          </tr>
        </thead>
        <tbody>
          <Row label="Deadline breached" a={doNothing.deadlineBreached ? "Yes" : "No"} b={nexusPlan.deadlineBreached ? "Yes" : "No"} />
          <Row label="Units at risk" a={String(doNothing.unitsAtRisk)} b={String(nexusPlan.unitsAtRisk)} />
          <Row label="Cost impact" a={formatINR(doNothing.costImpact)} b={formatINR(nexusPlan.costImpact)} />
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, a, b }: { label: string; a: string; b: string }): React.ReactElement {
  return (
    <tr className="border-t border-zinc-100">
      <td className="py-1.5 text-zinc-500">{label}</td>
      <td className="py-1.5 font-mono text-zinc-500">{a}</td>
      <td className="py-1.5 font-mono font-semibold text-zinc-900">{b}</td>
    </tr>
  );
}
