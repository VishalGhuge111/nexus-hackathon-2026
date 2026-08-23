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
    <Panel
      title="Disruption & Operational Risk"
      subtitle="Ground-truth telemetry signals and production impact threshold triggers"
      tone="primary"
    >
      <div className="mb-4 flex items-center gap-8 text-xs bg-zinc-50/80 p-3 rounded-lg border border-zinc-100">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Total Units At Risk</div>
          <div className="font-mono text-base font-bold text-zinc-900 mt-0.5">{unitsAtRisk} units</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Delivery Deadline Breached</div>
          <div className="mt-0.5">
            <StatusPill
              label={deadlineBreached ? "DEADLINE BREACHED" : "WITHIN BUFFER"}
              tone={deadlineBreached ? "danger" : "success"}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-100 pb-1.5">
              <th className="pb-1.5 font-semibold">Signal Indicator</th>
              <th className="pb-1.5 font-semibold">Observed Value</th>
              <th className="pb-1.5 font-semibold">Safety Threshold</th>
              <th className="pb-1.5 font-semibold">Telemetry Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {riskSignals.map((signal) => (
              <tr key={signal.id}>
                <td className="py-2 font-mono font-medium text-zinc-800">{signal.indicator}</td>
                <td className="py-2 font-mono font-bold text-red-600">{formatSignalValue(signal.value)}</td>
                <td className="py-2 font-mono text-zinc-500">{signal.threshold}</td>
                <td className="py-2 text-zinc-500 font-medium">{signal.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}