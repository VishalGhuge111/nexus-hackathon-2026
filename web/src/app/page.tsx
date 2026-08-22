'use client';
import React, { useState, useCallback } from 'react';
import { usePolling, type DashboardSummary, type CaseDetail } from '../lib/api-client';
import { FactoryStatusBar } from '../components/layout/FactoryStatusBar';
import { EarlyWarningBanner } from '../components/layout/EarlyWarningBanner';
import { KpiCard } from '../components/dashboard/KpiCard';
import { IncidentGrid } from '../components/dashboard/IncidentGrid';
import { DynamicIsland } from '../components/island/DynamicIsland';
import { AuditTimeline } from '../components/island/AuditTimeline';
import { Shield, AlertTriangle, DollarSign, Activity } from 'lucide-react';

function AuditSection({ caseId }: { caseId: string }) {
  const { data } = usePolling<CaseDetail>(`/api/cases/${caseId}`, 10000);
  if (!data) return null;
  return <AuditTimeline events={data.auditEvents} />;
}

export default function DashboardPage() {
  const { data, isLoading, error, mutate } = usePolling<DashboardSummary>('/api/dashboard/summary', 8000);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-zinc-500 text-sm font-medium">Establishing Mission Control Link...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="border border-red-200 bg-red-50 p-6 rounded-lg text-center max-w-sm">
          <p className="text-red-600 font-bold mb-1">Telemetry Link Failed</p>
          <p className="text-red-500 text-sm">{error?.message || 'No data'}</p>
        </div>
      </div>
    );
  }

  const { kpis, activeCases } = data;
  const criticalCase = activeCases.find(c => c.priority === 'CRITICAL');

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <FactoryStatusBar
          coverageDays={kpis.coverageDays}
          ordersSafe={127 - kpis.unitsAtRisk}
          recoveryCost={kpis.recoveryCost}
        />
        <EarlyWarningBanner coverageDays={kpis.coverageDays} />

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 p-6 pb-0">
          <KpiCard label="Production Coverage" value={Math.round(kpis.coverageDays * 10)} unit="days" icon={<Shield size={18} />} status={kpis.coverageDays < 2 ? 'critical' : kpis.coverageDays < 5 ? 'warn' : 'ok'} trend="down" />
          <KpiCard label="Orders at Risk" value={kpis.unitsAtRisk} icon={<AlertTriangle size={18} />} status={kpis.unitsAtRisk > 20 ? 'critical' : kpis.unitsAtRisk > 0 ? 'warn' : 'ok'} trend={kpis.unitsAtRisk > 0 ? 'down' : 'neutral'} />
          <KpiCard label="Recovery Cost" value={kpis.recoveryCost} prefix="Rs " icon={<DollarSign size={18} />} status="warn" trend="neutral" />
          <KpiCard label="Supplier Reliability" value={kpis.supplierReliability} unit="%" icon={<Activity size={18} />} status={kpis.supplierReliability < 80 ? 'warn' : 'ok'} trend="up" />
        </div>

        <div className="px-6 pt-5 pb-1 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900">Active Incidents</h2>
          <span className="text-xs text-zinc-400 font-medium">{activeCases.length} cases · Click to inspect</span>
        </div>
        <IncidentGrid cases={activeCases} selectedId={selectedId} onSelect={handleSelect} />

        {criticalCase && (
          <div className="px-0 pt-2">
            <AuditSection caseId={criticalCase.id} />
          </div>
        )}
      </div>

      <DynamicIsland selectedCaseId={selectedId} onResolved={mutate} />
    </div>
  );
}