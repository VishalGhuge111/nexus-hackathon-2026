"use client";

import { useMemo } from "react";
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { EarlyWarningBanner } from "@/components/layout/EarlyWarningBanner";
import { FactoryStatusBar } from "@/components/layout/FactoryStatusBar";
import { DashboardSummary as DashboardSummaryCards } from "@/components/dashboard/DashboardSummary";
import { IncidentGrid } from "@/components/dashboard/IncidentGrid";
import { DynamicIsland } from "@/components/island/DynamicIsland";
import { RecoveryTable } from "@/components/dashboard/RecoveryTable";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { usePolling } from "@/lib/api-client";
import type { DashboardSummary } from "@/lib/api-client";

export default function Page() {
  const { data } = usePolling<DashboardSummary>("/api/dashboard/summary", 10000);

  const cases = useMemo(() => data?.activeCases ?? data?.cases ?? [], [data]);
  const kpis = data?.kpis ?? {
    coverageDaysRemaining: 5.4,
    ordersAtRiskCount: 1,
    unitsAtRisk: 420,
    deadlinesBreachedCount: 1,
    emergencyBudgetRemaining: 184000
  };

  const coverageDays = kpis.coverageDaysRemaining ?? 5.4;
  const ordersSafe = Math.max(0, Math.max(1, cases.length) - kpis.ordersAtRiskCount);
  const recoveryCost = kpis.emergencyBudgetRemaining ?? 0;

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNav />

        <div className="flex-1 overflow-y-auto">
          <EarlyWarningBanner coverageDays={coverageDays} />
          <FactoryStatusBar
            coverageDays={coverageDays}
            ordersSafe={ordersSafe}
            recoveryCost={recoveryCost}
            currentGoal="Maintain Production Continuity"
          />

          <main className="space-y-6 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Operations Overview</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">Supply continuity dashboard</h1>
              </div>
            </div>

            <DashboardSummaryCards />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Active Cases"
                value={cases.length}
                icon={<Activity className="h-4 w-4" />}
                trend="up"
                status={cases.length > 0 ? "warn" : "ok"}
              />
              <KpiCard
                label="Orders At Risk"
                value={kpis.ordersAtRiskCount}
                icon={<AlertTriangle className="h-4 w-4" />}
                trend="down"
                status={kpis.ordersAtRiskCount > 0 ? "critical" : "ok"}
              />
              <KpiCard
                label="Units At Risk"
                value={kpis.unitsAtRisk}
                icon={<ShieldAlert className="h-4 w-4" />}
                trend="down"
                status={kpis.unitsAtRisk > 0 ? "warn" : "ok"}
              />
              <KpiCard
                label="Budget Remaining"
                value={recoveryCost}
                prefix="₹"
                icon={<CheckCircle2 className="h-4 w-4" />}
                trend="neutral"
                status="ok"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Live operations</p>
                    <h2 className="mt-1 text-xl font-bold text-zinc-900">Active incidents</h2>
                  </div>
                </div>
                <IncidentGrid cases={cases} loading={false} selectedId={null} onSelect={() => undefined} />
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Agent state</p>
                  <h2 className="mt-1 text-xl font-bold text-zinc-900">Dynamic mission activity</h2>
                </div>
                <DynamicIsland />
                <RecoveryTable />
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
