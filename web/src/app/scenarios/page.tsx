'use client';
import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import {
  FlaskConical,
  Truck,
  TrendingDown,
  Activity,
  ShieldAlert,
  PlayCircle,
  Loader2,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  XCircle,
  Cpu
} from 'lucide-react';
import {
  triggerShipmentDelay,
  triggerSupplierCapacityDrop,
  triggerDemandSpike,
  triggerSupplierClaimContradiction
} from '../../lib/api-client';
import { CaseDetailOverlay } from '../../components/mission-control/CaseDetailOverlay';

interface ScenarioDef {
  id: string;
  title: string;
  badge: string;
  category: 'POSITIVE TEST (RECOVERY)' | 'NEGATIVE TEST (DEFENSE & REJECTION)';
  tone: 'positive' | 'negative';
  description: string;
  expectedBehavior: string;
  judgeKeyTakeaway: string;
  icon: React.ReactNode;
  run: () => Promise<{ caseId: string }>;
}

const SCENARIOS: ScenarioDef[] = [
  {
    id: 'shipment-delay',
    title: 'In-Transit Shipment Delay (+24h)',
    badge: 'Golden Path · Full Recovery',
    category: 'POSITIVE TEST (RECOVERY)',
    tone: 'positive',
    icon: <Truck size={18} className="text-blue-600" />,
    description:
      'Purchase Order PO-1001 is delayed by 24h in transit, pushing delivery 12h past the hard manufacturing deadline.',
    expectedBehavior:
      'Autonomous engine verifies usable inventory (390 units), generates candidate recovery allocations, validates constraints, and pauses at governance gate for human sign-off.',
    judgeKeyTakeaway:
      'Demonstrates autonomous problem resolution, dual-sourcing quote synthesis, and operator sign-off.',
    run: () => triggerShipmentDelay(24)
  },
  {
    id: 'supplier-contradiction',
    title: 'Adversarial Supplier Contradiction',
    badge: 'Zero-Trust · Fraud Prevention',
    category: 'NEGATIVE TEST (DEFENSE & REJECTION)',
    tone: 'negative',
    icon: <ShieldAlert size={18} className="text-rose-600" />,
    description:
      'Vendor claims "dispatched, in transit", but carrier GPS telemetry shows "label created, no pickup scanned".',
    expectedBehavior:
      'Engine flags contradiction, records discrepancy in immutable audit log, and immediately DISQUALIFIES the deceptive vendor from participating in recovery plans.',
    judgeKeyTakeaway:
      'Demonstrates zero-trust verification that prevents hallucinations and protects enterprise spend.',
    run: () => triggerSupplierClaimContradiction()
  },
  {
    id: 'capacity-drop',
    title: 'Supplier Capacity Drop (-50%)',
    badge: 'Constraint Enforcement',
    category: 'POSITIVE TEST (RECOVERY)',
    tone: 'positive',
    icon: <TrendingDown size={18} className="text-amber-600" />,
    description:
      'Primary supplier suffers equipment failure, dropping cycle output ceiling from 1,000 units down to 500 units.',
    expectedBehavior:
      'Validator detects single-supplier capacity breach, forcing the engine to synthesize a dual-sourcing split allocation across multiple vetted vendors.',
    judgeKeyTakeaway:
      'Demonstrates deterministic multi-supplier allocation within strict capacity ceilings.',
    run: () => triggerSupplierCapacityDrop(50)
  },
  {
    id: 'demand-spike',
    title: 'Surge Demand Spike (+30%)',
    badge: 'Early Risk Telemetry',
    category: 'POSITIVE TEST (RECOVERY)',
    tone: 'positive',
    icon: <Activity size={18} className="text-indigo-600" />,
    description:
      'Production demand surges from 90 units/day to 117 units/day (+30%), cutting warehouse safety buffer.',
    expectedBehavior:
      'Coverage calculation drops below safety threshold (3.33d < 5.0d target), triggering early risk monitor warnings before physical stockout occurs.',
    judgeKeyTakeaway:
      'Demonstrates predictive early-warning detection before assembly line stoppages.',
    run: () => triggerDemandSpike(30)
  }
];

export default function ScenariosPage() {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { caseId?: string; error?: string }>>({});
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE'>('ALL');

  async function handleRun(scenario: ScenarioDef) {
    setRunningId(scenario.id);
    try {
      const { caseId } = await scenario.run();
      setResults((prev) => ({ ...prev, [scenario.id]: { caseId } }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [scenario.id]: { error: err instanceof Error ? err.message : String(err) }
      }));
    } finally {
      setRunningId(null);
    }
  }

  const filteredScenarios = SCENARIOS.filter((s) => {
    if (activeTab === 'POSITIVE') return s.tone === 'positive';
    if (activeTab === 'NEGATIVE') return s.tone === 'negative';
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50/70">
      <PageHeader
        title="Scenario Simulation Lab"
        description="Interactive judge & operator console: executes live mutations through the full multi-agent decision engine."
        icon={<FlaskConical size={18} className="text-blue-600" />}
      />

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Target Context Banner */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Cpu size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Simulation Environment
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Live Store Ready
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-zinc-900 tracking-tight mt-0.5">
                    Target Assembly: <span className="font-mono text-blue-600">COMP-ALPHA</span> (Bearing Assembly) · Line 1
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-zinc-600 bg-zinc-50 px-3.5 py-2 rounded-lg border border-zinc-200/60">
                <div>
                  <span className="text-zinc-400">Usable Stock:</span> <strong className="text-zinc-900">390 units</strong>
                </div>
                <div>
                  <span className="text-zinc-400">Target Output:</span> <strong className="text-zinc-900">900 units</strong>
                </div>
                <div>
                  <span className="text-zinc-400">Safety Cap:</span> <strong className="text-zinc-900">5.0d</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Testing Filter Tabs */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-semibold">Filter Scenarios:</span>
              <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70 text-xs">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`cursor-pointer px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    activeTab === 'ALL' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  All Scenarios (4)
                </button>
                <button
                  onClick={() => setActiveTab('POSITIVE')}
                  className={`cursor-pointer px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    activeTab === 'POSITIVE'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Positive Tests (Recovery)
                </button>
                <button
                  onClick={() => setActiveTab('NEGATIVE')}
                  className={`cursor-pointer px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    activeTab === 'NEGATIVE'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Negative Tests (Fraud Defense)
                </button>
              </div>
            </div>
          </div>

          {/* Scenario Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredScenarios.map((scenario) => {
              const isRunning = runningId === scenario.id;
              const result = results[scenario.id];
              const succeeded = result && 'caseId' in result ? result : null;
              const failed = result && 'error' in result ? result : null;
              const isPositive = scenario.tone === 'positive';

              return (
                <div
                  key={scenario.id}
                  className="bg-white border border-zinc-200/90 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                            isPositive ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'
                          }`}
                        >
                          {scenario.icon}
                        </div>
                        <div>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isPositive ? 'text-emerald-800 bg-emerald-50' : 'text-rose-800 bg-rose-50'
                            }`}
                          >
                            {scenario.category}
                          </span>
                          <h3 className="font-bold text-zinc-900 text-base mt-1 tracking-tight">
                            {scenario.title}
                          </h3>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60 shrink-0">
                        {scenario.badge}
                      </span>
                    </div>

                    {/* Disruption Description */}
                    <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                      {scenario.description}
                    </p>

                    {/* Expected Engine Behavior */}
                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 mb-3 space-y-1 text-xs">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                        Engine Progression
                      </div>
                      <p className="text-zinc-700 font-medium text-[11px] leading-snug">
                        {scenario.expectedBehavior}
                      </p>
                    </div>

                    {/* Judge Takeaway */}
                    <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100/70 text-[11px] text-blue-900 mb-3.5">
                      <span className="font-bold">What Judges Evaluate: </span>
                      <span>{scenario.judgeKeyTakeaway}</span>
                    </div>
                  </div>

                  {failed && (
                    <div className="p-2.5 mb-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                      {failed.error}
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100">
                    <button
                      onClick={() => handleRun(scenario)}
                      disabled={isRunning}
                      className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-zinc-800 active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 shadow-2xs"
                    >
                      {isRunning ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                      <span>{isRunning ? 'Running Engine…' : 'Launch Simulation'}</span>
                    </button>

                    {succeeded && (
                      <button
                        onClick={() => { if (succeeded.caseId) setOpenCaseId(succeeded.caseId); }}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-2 text-xs font-bold transition-colors hover:bg-emerald-100"
                      >
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>Inspect Case ({succeeded.caseId})</span>
                        <ArrowUpRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {openCaseId && <CaseDetailOverlay caseId={openCaseId} onClose={() => setOpenCaseId(null)} />}
    </div>
  );
}