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
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
          Impact Comparison: Do-Nothing vs. NEXUS Recovery
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-100 pb-1.5">
              <th className="pb-1.5 font-semibold">Metric</th>
              <th className="pb-1.5 font-semibold text-rose-700">Do-Nothing Baseline</th>
              <th className="pb-1.5 font-semibold text-emerald-700">NEXUS Autonomous Plan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            <Row
              label="Production Deadline Breached"
              a={doNothing.deadlineBreached ? "YES (Breached)" : "NO"}
              b={nexusPlan.deadlineBreached ? "YES" : "NO (Protected)"}
              badA={doNothing.deadlineBreached}
              goodB={!nexusPlan.deadlineBreached}
            />
            <Row
              label="Manufacturing Units At Risk"
              a={`${doNothing.unitsAtRisk} units lost`}
              b={`${nexusPlan.unitsAtRisk} units lost`}
              badA={doNothing.unitsAtRisk > 0}
              goodB={nexusPlan.unitsAtRisk === 0}
            />
            <Row
              label="Financial Impact / Net Cost"
              a={formatINR(doNothing.costImpact)}
              b={formatINR(nexusPlan.costImpact)}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  label,
  a,
  b,
  badA,
  goodB
}: {
  label: string;
  a: string;
  b: string;
  badA?: boolean;
  goodB?: boolean;
}): React.ReactElement {
  return (
    <tr>
      <td className="py-2 text-zinc-600 font-medium">{label}</td>
      <td className={`py-2 font-mono ${badA ? "text-red-600 font-bold" : "text-zinc-500"}`}>{a}</td>
      <td className={`py-2 font-mono font-bold ${goodB ? "text-emerald-700" : "text-zinc-900"}`}>{b}</td>
    </tr>
  );
}