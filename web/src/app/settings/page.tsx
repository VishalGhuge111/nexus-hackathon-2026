'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Settings, Database, Cpu, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { fetchSystemStatus } from '../../lib/api-client';
import type { SystemStatus } from '../../lib/api-client';

function StatusRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-semibold text-zinc-900">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSystemStatus()
      .then((data) => { if (!cancelled) setStatus(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50">
      <PageHeader
        title="System Configuration"
        description="Real runtime status — which backends this deployment is actually running against."
        icon={<Settings size={20} className="text-blue-600" />}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load system status: {error}
            </div>
          )}

          {!status && !error ? (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-zinc-400">
              <Loader2 size={16} className="animate-spin" /> Loading system status…
            </div>
          ) : status ? (
            <>
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
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">LLM</h2>
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
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
