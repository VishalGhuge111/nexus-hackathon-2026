'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Settings, Database, Cpu, CheckCircle2, AlertCircle, Shield, Sliders, Server } from 'lucide-react';
import { fetchSystemStatus } from '../../lib/api-client';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import type { SystemStatus } from '../../lib/api-client';

function StatusRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-100/80 last:border-0 text-xs">
      <span className="text-zinc-500 font-medium">{label}</span>
      <span className="font-semibold text-zinc-900 font-mono">{value}</span>
    </div>
  );
}

function SettingsCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-2">
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
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50/70">
      <PageHeader
        title="System Architecture & Configuration"
        description="Active runtime topology, database persistence layers, LLM decision engine adapters, and governance safety boundaries."
        icon={<Settings size={18} className="text-blue-600" />}
      />

      <div className="max-w-4xl w-full mx-auto p-6 lg:p-8 space-y-6 flex-1">
        {error ? (
          <ErrorState message={`Failed to load system status: ${error}`} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : !status ? (
          <div className="space-y-4">
            <SettingsCardSkeleton rows={2} />
            <SettingsCardSkeleton rows={3} />
            <SettingsCardSkeleton rows={5} />
            <SettingsCardSkeleton rows={2} />
          </div>
        ) : (
          <div className="animate-fade-in space-y-5">
            {/* Database Layer */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-blue-600" />
                  <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Persistence & Database Store
                  </h2>
                </div>
                {status.database.configured ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 size={12} /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <AlertCircle size={12} /> Local Memory
                  </span>
                )}
              </div>
              <StatusRow
                label="Persistence Mode"
                value={status.database.mode === 'neon' ? 'Neon Serverless Postgres / Prisma' : 'In-Memory State Store (Deterministic)'}
              />
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{status.database.description}</p>
            </div>

            {/* AI Engine Layer */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-purple-600" />
                  <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    AI Decision & Planning Engine
                  </h2>
                </div>
                {status.llm.configured ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 size={12} /> Live API
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <CheckCircle2 size={12} /> Deterministic Stub
                  </span>
                )}
              </div>
              <StatusRow
                label="Adapter Mode"
                value={status.llm.mode === 'anthropic' ? 'Anthropic Claude 3.5 Sonnet' : 'Deterministic Seeded Engine'}
              />
              {status.llm.model && <StatusRow label="Model Identifier" value={status.llm.model} />}
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{status.llm.description}</p>
            </div>

            {/* Governance Safety Boundaries */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-3 border-b border-zinc-100 pb-2.5">
                <Shield size={16} className="text-emerald-600" />
                <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Agent Safety Boundaries & Governance Rules
                </h2>
              </div>
              <StatusRow label="Max Tool Calls Per Case" value={`${status.agentConfig.maxToolCallsPerCase} calls`} />
              <StatusRow label="Max Autonomous Replans" value={`${status.agentConfig.maxReplans} replans`} />
              <StatusRow
                label="Human Escalation Approval Threshold"
                value={`₹${status.agentConfig.approvalThreshold.toLocaleString('en-IN')}`}
              />
              <StatusRow
                label="Minimum Supplier Quality Floor"
                value={`${(status.agentConfig.minSupplierQualityForCase * 100).toFixed(0)}%`}
              />
              <StatusRow
                label="Minimum Supplier Reliability Floor"
                value={`${(status.agentConfig.minSupplierReliabilityForCase * 100).toFixed(0)}%`}
              />
            </div>

            {/* Runtime Info */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-3 border-b border-zinc-100 pb-2.5">
                <Server size={16} className="text-zinc-600" />
                <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Node Runtime Environment
                </h2>
              </div>
              <StatusRow label="Node.js Engine" value={status.runtime.nodeVersion} />
              <StatusRow label="Environment" value={status.runtime.environment} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}