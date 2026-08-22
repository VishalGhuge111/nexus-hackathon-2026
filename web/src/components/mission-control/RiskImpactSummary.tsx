// PRD §11/§26 — RiskSignal[] threshold evidence, and §19 continuityImpact.
// "This is what the audit trail shows a judge to prove the trigger wasn't hand-waved."
import type { RiskSignal } from "@nexus/shared/types/case";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";
import { formatSignalValue } from "@/lib/missionControl/format";

export function RiskImpactSummary({
  riskSignals,
  unitsAtRisk,
  deadlineBreached
}: {
  riskSignals: RiskSignal[];
  unitsAtRisk: number;
  deadlineBreached: boolean;
}): React.ReactElement {
  return (
    <Panel title="Risk / Production Impact" subtitle="Threshold evidence behind why this Case opened (§11)" tone="primary">
      <div className="mb-3 flex gap-6 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-zinc-400">Units at risk</div>
          <div className="font-mono text-lg font-semibold text-zinc-900">{unitsAtRisk}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-zinc-400">Deadline breached</div>
          <StatusPill label={deadlineBreached ? "YES" : "NO"} tone={deadlineBreached ? "danger" : "success"} />
        </div>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-zinc-400">
            <th className="pb-1 font-normal">Indicator</th>
            <th className="pb-1 font-normal">Value</th>
            <th className="pb-1 font-normal">Threshold</th>
            <th className="pb-1 font-normal">Source</th>
          </tr>
        </thead>
        <tbody>
          {riskSignals.map((signal) => (
            <tr key={signal.id} className="border-t border-zinc-100">
              <td className="py-1.5 font-mono text-zinc-700">{signal.indicator}</td>
              <td className="py-1.5 font-mono font-semibold text-red-600">{formatSignalValue(signal.value)}</td>
              <td className="py-1.5 font-mono text-zinc-500">{signal.threshold}</td>
              <td className="py-1.5 text-zinc-400">{signal.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
