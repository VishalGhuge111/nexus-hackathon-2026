import type { RiskSignal } from "@nexus/shared/types/case";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";
import { formatSignalValue } from "@/lib/missionControl/format";
import { AlertCircle } from "lucide-react";

const SIGNAL_LABELS: Record<string, { label: string; explanation: string }> = {
  coverage_days: {
    label: "Warehouse Stock Coverage",
    explanation: "Number of production days current usable stock will last"
  },
  production_deadline_slack: {
    label: "Delivery Deadline Buffer",
    explanation: "Safety margin between shipment arrival and manufacturing deadline"
  },
  safety_stock_ratio: {
    label: "Safety Stock Margin",
    explanation: "Ratio of warehouse buffer stock remaining vs safety threshold"
  }
};

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
      subtitle="Live telemetry signals comparing physical warehouse stock against production targets"
      tone="primary"
    >
      <div className="mb-4 flex items-center justify-between gap-6 text-xs bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Total Units At Risk</div>
          <div className="font-mono text-lg font-bold text-zinc-900 mt-0.5">
            {unitsAtRisk === 0 ? "0 units (Protected)" : `${unitsAtRisk} units`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">Delivery Schedule</div>
          <StatusPill
            label={deadlineBreached ? "DEADLINE BREACHED" : "ON SCHEDULE (WITHIN BUFFER)"}
            tone={deadlineBreached ? "danger" : "success"}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-100 pb-2">
              <th className="pb-2 font-semibold">Telemetry Metric</th>
              <th className="pb-2 font-semibold">Observed Value</th>
              <th className="pb-2 font-semibold">Target Threshold</th>
              <th className="pb-2 font-semibold">Data Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {riskSignals.map((signal) => {
              const meta = SIGNAL_LABELS[signal.indicator] ?? {
                label: signal.indicator,
                explanation: "Telemetry indicator"
              };

              return (
                <tr key={signal.id} className="py-2.5">
                  <td className="py-2.5">
                    <div className="font-bold text-zinc-900">{meta.label}</div>
                    <div className="text-[10px] font-mono text-zinc-400">{signal.indicator}</div>
                  </td>
                  <td className="py-2.5 font-mono font-bold text-red-600 text-sm">
                    {formatSignalValue(signal.value)}
                  </td>
                  <td className="py-2.5 font-mono text-zinc-600 font-medium">
                    {signal.threshold} days
                  </td>
                  <td className="py-2.5 text-zinc-600 capitalize font-medium">
                    {signal.source}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}