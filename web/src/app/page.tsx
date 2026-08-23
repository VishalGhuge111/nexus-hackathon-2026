"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, Zap, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { EarlyWarningBanner } from "@/components/layout/EarlyWarningBanner";
import { FactoryStatusBar } from "@/components/layout/FactoryStatusBar";
import { IncidentGrid } from "@/components/dashboard/IncidentGrid";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { TriggerEventButton } from "@/components/dashboard/TriggerEventButton";
import { CaseDetailOverlay } from "@/components/mission-control/CaseDetailOverlay";
import { ErrorState } from "@/components/ui/ErrorState";
import { usePolling } from "@/lib/api-client";
import type { DashboardSummary } from "@/lib/api-client";

export default function Page() {
  const { data, error, refresh } = usePolling<DashboardSummary>("/api/dashboard/summary", 8000);
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);

  const cases = useMemo(() => data?.activeCases ?? data?.cases ?? [], [data]);
  const kpis = data?.kpis ?? null;

  const coverageDays = kpis?.coverageDaysRemaining ?? null;
  const ordersSafe = kpis ? Math.max(0, Math.max(1, cases.length) - kpis.ordersAtRiskCount) : null;
  const recoveryCost = kpis?.emergencyBudgetRemaining ?? null;

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50/70">
      {coverageDays !== null && <EarlyWarningBanner coverageDays={coverageDays} />}
      <FactoryStatusBar
        coverageDays={coverageDays}
        ordersSafe={ordersSafe}
        recoveryCost={recoveryCost}
        currentGoal={cases.length > 0 ? "Resolve Active Disruption & Protect Continuity" : "Maintain Production Continuity"}
      />

      <main className="max-w-7xl w-full mx-auto p-6 lg:p-8 space-y-6 flex-1">
        {/* Header section with live operator context */}
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-zinc-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                Operations Command
              </span>
              <span className="text-zinc-300">·</span>
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Autonomous Recovery
              </span>
            </div>
            <h1 className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900">
              Supply Continuity Overview
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/scenarios"
              className="hidden sm:inline-flex cursor-pointer items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-2xs transition-colors"
            >
              <span>Scenario Lab</span>
              <ArrowUpRight size={13} className="text-zinc-400" />
            </Link>
            <TriggerEventButton
              onTriggered={async (caseId) => {
                await refresh();
                setOpenCaseId(caseId);
              }}
            />
          </div>
        </div>

        {error && (
          <ErrorState message={`Live telemetry stream interrupted: ${error}`} onRetry={() => refresh()} compact />
        )}

        {/* 4 Key Performance Indicators */}
        <section aria-label="Key Operations Metrics">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Active Incidents"
              value={data ? cases.length : null}
              icon={<Activity className="h-4 w-4" />}
              trend={data && cases.length > 0 ? "up" : "neutral"}
              status={cases.length > 0 ? "warn" : "ok"}
              note="Across all lines"
            />
            <KpiCard
              label="Orders At Risk"
              value={kpis?.ordersAtRiskCount ?? null}
              icon={<AlertTriangle className="h-4 w-4" />}
              trend={kpis && kpis.ordersAtRiskCount > 0 ? "down" : "neutral"}
              status={(kpis?.ordersAtRiskCount ?? 0) > 0 ? "critical" : "ok"}
              note="Continuity target breached"
            />
            <KpiCard
              label="Units At Risk"
              value={kpis?.unitsAtRisk ?? null}
              unit="units"
              icon={<ShieldAlert className="h-4 w-4" />}
              trend={kpis && kpis.unitsAtRisk > 0 ? "down" : "neutral"}
              status={(kpis?.unitsAtRisk ?? 0) > 0 ? "warn" : "ok"}
              note="BOM component deficit"
            />
            <KpiCard
              label="Recovery Budget Remaining"
              value={recoveryCost}
              prefix="₹"
              icon={<CheckCircle2 className="h-4 w-4" />}
              trend="neutral"
              status="ok"
              note="Emergency allowance"
            />
          </div>
        </section>

        {/* Core Operations Grid */}
        <section className="grid gap-6 xl:grid-cols-[1.65fr_1fr] items-start">
          {/* Active Incidents Container */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 lg:p-6 shadow-2xs">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Live Disruption Radar</p>
                <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Active Disruption Cases</h2>
              </div>
              <span className="font-mono text-xs font-semibold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200/60">
                {cases.length} case{cases.length === 1 ? '' : 's'} tracked
              </span>
            </div>
            <IncidentGrid cases={cases} loading={!data} selectedId={openCaseId} onSelect={(id) => setOpenCaseId(id)} />
          </div>

          {/* Real-time Agent Activity Feed */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 lg:p-6 shadow-2xs">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Execution Trace</p>
                <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Live Agent Activity</h2>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Streaming</span>
              </div>
            </div>
            <RecentActivityFeed />
          </div>
        </section>
      </main>

      {/* Case Detail Modal / Mission Overlay */}
      {openCaseId && <CaseDetailOverlay caseId={openCaseId} onClose={() => setOpenCaseId(null)} />}
    </div>
  );
}