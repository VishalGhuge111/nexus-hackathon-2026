'use client';
import React from 'react';
import type { RiskSignal } from "@nexus/shared/types/case";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";
import { formatSignalValue } from "@/lib/missionControl/format";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

const SIGNAL_METADATA: Record<string, { title: string; subtitle: string; unit: string }> = {
  coverage_days: {
    title: "Warehouse Stock Coverage",
    subtitle: "Days of manufacturing buffer remaining at current consumption rate",
    unit: "days"
  },
  production_deadline_slack: {
    title: "Production Schedule Slack",
    subtitle: "Safety margin between shipment arrival and manufacturing deadline",
    unit: "days"
  },
  safety_stock_ratio: {
    title: "Safety Stock Buffer Ratio",
    subtitle: "Remaining stock ratio compared to safety threshold",
    unit: "x"
  },
  supplier_reliability_score: {
    title: "Supplier Reliability Score",
    subtitle: "Historical fulfillment rating of component vendor",
    unit: ""
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
  // Deduplicate to show only the LATEST reading per unique indicator
  const latestSignalsMap = new Map<string, RiskSignal>();
  for (const sig of riskSignals) {
    latestSignalsMap.set(sig.indicator, sig);
  }
  const latestSignals = Array.from(latestSignalsMap.values());

  return (
    <Panel
      title="Disruption & Operational Risk"
      subtitle="Ground-truth telemetry comparing live warehouse inventory against production commitments"
      tone="primary"
    >
      {/* Top High-Level Summary */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/70 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Total Units At Risk</div>
            <div className="font-mono text-base font-bold text-zinc-900 mt-0.5">
              {unitsAtRisk === 0 ? "0 units (Protected)" : `${unitsAtRisk} units threatened`}
            </div>
          </div>
          {unitsAtRisk === 0 ? (
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          )}
        </div>

        <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/70 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Assembly Line Status</div>
            <div className="mt-1">
              <StatusPill
                label={deadlineBreached ? "DEADLINE BREACHED" : "ON SCHEDULE (WITHIN BUFFER)"}
                tone={deadlineBreached ? "danger" : "success"}
              />
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Activity size={16} />
          </div>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">
          Active Telemetry Signals ({latestSignals.length} indicators monitored)
        </div>

        {latestSignals.length === 0 ? (
          <div className="p-4 bg-zinc-50 rounded-lg text-xs text-zinc-500 text-center">
            All factory signals within normal operating safety parameters.
          </div>
        ) : (
          latestSignals.map((signal) => {
            const meta = SIGNAL_METADATA[signal.indicator] ?? {
              title: signal.indicator,
              subtitle: "Operational telemetry metric",
              unit: ""
            };
            const isBreached = typeof signal.value === "number" && signal.value < signal.threshold;

            return (
              <div
                key={signal.id || signal.indicator}
                className="p-3 bg-white rounded-xl border border-zinc-200/80 shadow-2xs flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 text-xs">{meta.title}</span>
                    <span className="text-[10px] font-mono text-zinc-400">({signal.source})</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{meta.subtitle}</p>
                </div>

                <div className="flex items-center gap-4 text-right shrink-0">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400">Observed</div>
                    <div className={`font-mono text-sm font-bold ${isBreached ? "text-red-600" : "text-emerald-700"}`}>
                      {formatSignalValue(signal.value)} {meta.unit}
                    </div>
                  </div>
                  <div className="border-l border-zinc-200 pl-3">
                    <div className="text-[10px] uppercase font-bold text-zinc-400">Target</div>
                    <div className="font-mono text-xs text-zinc-700 font-medium">
                      ≥ {signal.threshold} {meta.unit}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}