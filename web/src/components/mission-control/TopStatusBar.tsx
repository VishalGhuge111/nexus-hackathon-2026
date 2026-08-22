// PRD §28 — "Top status bar (always visible): Current Goal, Coverage Remaining,
// Production Status (protected/at-risk/breached), Current Risk level."
import { formatINR } from "@/lib/missionControl/format";

function Stat({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }): React.ReactElement {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`font-mono ${emphasis ? "text-base font-semibold text-slate-100" : "text-sm text-slate-200"}`}>
        {value}
      </div>
    </div>
  );
}

export type ProductionStatus = "PROTECTED" | "AT_RISK" | "BREACHED";

const PRODUCTION_STATUS_STYLE: Record<ProductionStatus, string> = {
  PROTECTED: "text-emerald-400",
  AT_RISK: "text-amber-400",
  BREACHED: "text-red-400"
};

export function TopStatusBar({
  productionStatus,
  coverageDaysRemaining,
  ordersAtRiskCount,
  unitsAtRisk,
  deadlinesBreachedCount,
  emergencyBudgetRemaining
}: {
  productionStatus: ProductionStatus;
  coverageDaysRemaining: number;
  ordersAtRiskCount: number;
  unitsAtRisk: number;
  deadlinesBreachedCount: number;
  emergencyBudgetRemaining: number;
}): React.ReactElement {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b border-slate-800 bg-slate-950 px-6 py-4">
      <div>
        <h1 className="text-base font-semibold tracking-wide text-slate-100">NEXUS</h1>
        <p className="text-xs text-slate-500">Autonomous supply-chain continuity agent — Mission Control</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Production Status</div>
          <div className={`font-mono text-lg font-bold ${PRODUCTION_STATUS_STYLE[productionStatus]}`}>
            {productionStatus.replace("_", " ")}
          </div>
        </div>
        <Stat label="Units At Risk" value={String(unitsAtRisk)} emphasis />
        <Stat label="Deadlines Breached" value={String(deadlinesBreachedCount)} emphasis />
        <Stat label="Coverage Remaining" value={`${coverageDaysRemaining.toFixed(1)}d`} />
        <Stat label="Orders At Risk" value={String(ordersAtRiskCount)} />
        <Stat label="Emergency Budget Remaining" value={formatINR(emergencyBudgetRemaining)} />
      </div>
    </header>
  );
}
