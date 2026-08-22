// PRD §28 — "Top status bar (always visible): Current Goal, Coverage Remaining,
// Production Status (protected/at-risk/breached), Current Risk level."
import { formatINR } from "@/lib/missionControl/format";
import { StatusPill, type PillTone } from "./StatusPill";

function Stat({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }): React.ReactElement {
  return (
    <div>
      <div className="text-[11px] tracking-wide text-slate-500 uppercase">{label}</div>
      <div className={`font-mono ${emphasis ? "text-base font-semibold text-slate-100" : "text-sm text-slate-200"}`}>
        {value}
      </div>
    </div>
  );
}

export type ProductionStatus = "PROTECTED" | "AT_RISK" | "BREACHED";

const PRODUCTION_STATUS_TONE: Record<ProductionStatus, PillTone> = {
  PROTECTED: "success",
  AT_RISK: "warning",
  BREACHED: "danger"
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
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-500/15 font-mono text-sm font-bold text-sky-400 ring-1 ring-inset ring-sky-500/30">
          N
        </div>
        <div>
          <h1 className="text-base leading-tight font-semibold tracking-wide text-slate-100">NEXUS</h1>
          <p className="text-xs leading-tight text-slate-500">Autonomous supply-chain continuity agent — Mission Control</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <div>
          <div className="mb-1 text-[11px] tracking-wide text-slate-500 uppercase">Production Status</div>
          <StatusPill label={productionStatus.replace("_", " ")} tone={PRODUCTION_STATUS_TONE[productionStatus]} dot />
        </div>
        <div className="h-8 w-px bg-slate-800" aria-hidden />
        <Stat label="Units At Risk" value={String(unitsAtRisk)} emphasis />
        <Stat label="Deadlines Breached" value={String(deadlinesBreachedCount)} emphasis />
        <Stat label="Coverage Remaining" value={`${coverageDaysRemaining.toFixed(1)}d`} />
        <Stat label="Orders At Risk" value={String(ordersAtRiskCount)} />
        <Stat label="Emergency Budget Remaining" value={formatINR(emergencyBudgetRemaining)} />
      </div>
    </header>
  );
}
