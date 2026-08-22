'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Settings, Database, Cpu, CheckCircle2, XCircle } from 'lucide-react';
import { fetchSystemStatus } from '../../lib/api-client';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import type { SystemStatus } from '../../lib/api-client';

function StatusRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-semibold text-zinc-900">{value}</span>
    </div>
  );
}

function SettingsCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchSystemStatus()
      .then((data) => { if (!cancelled) setStatus(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50">
      <PageHeader
        title="System Status"
        description="Real runtime status — which backends this deployment is actually running against."
        icon={<Settings size={20} className="text-blue-600" />}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {error ? (
            <ErrorState message={`Failed to load system status: ${error}`} onRetry={() => setReloadKey((k) => k + 1)} />
          ) : !status ? (
            <>
              <SettingsCardSkeleton rows={1} />
              <SettingsCardSkeleton rows={2} />
              <SettingsCardSkeleton rows={5} />
              <SettingsCardSkeleton rows={2} />
            </>
          ) : (
            <div className="animate-fade-in space-y-6">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Database size={16} className="text-blue-600" />
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Database</h2>
                  {status.database.configured ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : (
                    <XCircle size={14} className="text-amber-500" />
                  )}
                </div>
                <StatusRow label="Mode" value={status.database.mode === 'neon' ? 'Neon / Prisma (Postgres)' : 'In-memory (local/test)'} />
                <p className="text-xs text-zinc-500 mt-3">{status.database.description}</p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu size={16} className="text-blue-600" />
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">AI Engine</h2>
                  {status.llm.configured ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : (
                    <XCircle size={14} className="text-amber-500" />
                  )}
                </div>
                <StatusRow label="Mode" value={status.llm.mode === 'anthropic' ? 'Anthropic (live)' : 'Deterministic stub (local/test)'} />
                {status.llm.model && <StatusRow label="Model" value={status.llm.model} />}
                <p className="text-xs text-zinc-500 mt-3">{status.llm.description}</p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide mb-3">Agent policy</h2>
                <StatusRow label="Max tool calls / case" value={status.agentConfig.maxToolCallsPerCase} />
                <StatusRow label="Max replans" value={status.agentConfig.maxReplans} />
                <StatusRow label="Approval threshold" value={`₹${status.agentConfig.approvalThreshold.toLocaleString('en-IN')}`} />
                <StatusRow label="Min supplier quality" value={status.agentConfig.minSupplierQualityForCase} />
                <StatusRow label="Min supplier reliability" value={status.agentConfig.minSupplierReliabilityForCase} />
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide mb-3">Runtime</h2>
                <StatusRow label="Node version" value={status.runtime.nodeVersion} />
                <StatusRow label="Environment" value={status.runtime.environment} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
