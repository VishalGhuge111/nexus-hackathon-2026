'use client';
import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { CaseDetailOverlay } from '../../components/mission-control/CaseDetailOverlay';
import {
  FlaskConical,
  Truck,
  Factory,
  TrendingUp,
  ShieldAlert,
  Loader2,
  PlayCircle,
  ArrowUpRight,
  Sparkles,
  Layers,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import {
  triggerShipmentDelay,
  triggerSupplierCapacityDrop,
  triggerDemandSpike,
  triggerSupplierClaimContradiction
} from '../../lib/api-client';

interface Scenario {
  id: string;
  title: string;
  category: string;
  badge: string;
  disruption: string;
  description: string;
  icon: React.ReactNode;
  run: () => Promise<{ caseId: string }>;
  expectedBehavior: string;
  psReference: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'shipment-delay',
    title: 'Shipment Delay (+24h)',
    category: 'End-to-End Autonomous Loop',
    badge: 'Golden Path',
    disruption: 'In-transit shipment SHP-001 delayed past safety threshold',
    description:
      'Triggers the full autonomous recovery lifecycle: risk detection, multi-supplier eligibility evaluation, replanning with dual-sourcing, and human sign-off gating before dispatch.',
    icon: <Truck size={18} />,
    run: () => triggerShipmentDelay(24),
    expectedBehavior: 'Agent detects delay → queries RFQs → compiles V1/V2 plan → escalates for approval.',
    psReference: 'PRD §11, §10 FSM, Figure 1'
  },
  {
    id: 'supplier-capacity-drop',
    title: 'Supplier Capacity Drop (-50%)',
    category: 'Dynamic Replanning Under Constraint',
    badge: 'Replanning V1 → V2',
    disruption: 'Primary supplier maximum output drops mid-fulfillment',
    description:
      'Tests dynamic adaptation when a supplier capacity constraint tightens. The agent re-runs the validator, invalidates single-source assumptions, and generates a split-allocation recovery plan.',
    icon: <Factory size={18} />,
    run: () => triggerSupplierCapacityDrop(50),
    expectedBehavior: 'Re-evaluates supplier capacity → triggers ADAPT_REPLAN → preserves valid allocations into V2.',
    psReference: 'PRD §23, Figure 3'
  },
  {
    id: 'demand-spike',
    title: 'Production Demand Spike (+30%)',
    category: 'Proactive Early Warning',
    badge: 'Early Risk Monitor',
    disruption: 'Daily component burn rate surges by 30% on active Line Alpha',
    description:
      'Tests proactive early-warning sensitivity. The agent recalculates coverage days and identifies impending inventory exhaustion before physical shipment failure occurs.',
    icon: <TrendingUp size={18} />,
    run: () => triggerDemandSpike(30),
    expectedBehavior: 'Recalculates usable stock coverage → flags early risk → prepares contingency RFQs.',
    psReference: 'PRD §11 (Indicator INVENTORY_LOW)'
  },
  {
    id: 'supplier-claim-contradiction',
    title: 'Zero-Trust Supplier Contradiction',
    category: 'Adversarial Verification',
    badge: 'Ground Truth Gate',
    disruption: 'Supplier claims dispatch while carrier tracking records zero pickup',
    description:
      'Tests zero-trust telemetry verification. The agent cross-examines supplier statements against verified tracking APIs and excludes unreliable suppliers from candidate plans.',
    icon: <ShieldAlert size={18} />,
    run: () => triggerSupplierClaimContradiction(),
    expectedBehavior: 'Identifies discrepancy → flags contradiction in audit trail → eliminates supplier from plan.',
    psReference: 'PRD §14 (Carrier Ground Truth)'
  }
];

export default function ScenarioLabPage() {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { caseId: string } | { error: string }>>({});
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);

  async function handleRun(scenario: Scenario) {
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

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50/70">
      <PageHeader
        title="Scenario Simulation Lab"
        description="Operator simulation console: executes real backend mutations through the full multi-agent decision engine."
        icon={<FlaskConical size={20} className="text-blue-600" />}
      />

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Target Context Banner */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Cpu size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Simulation Environment
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Live Store Ready
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-zinc-900 tracking-tight mt-0.5">
                    Target Assembly: <span className="font-mono text-blue-600">COMP-ALPHA</span> (Bearing Assembly) · Production Line 1
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-zinc-600 bg-zinc-50 px-3.5 py-2 rounded-lg border border-zinc-200/60">
                <div>
                  <span className="text-zinc-400">Order:</span> <strong className="text-zinc-900">PO-2026-X1</strong>
                </div>
                <div>
                  <span className="text-zinc-400">BOM Qty:</span> <strong className="text-zinc-900">1 unit/SKU</strong>
                </div>
                <div>
                  <span className="text-zinc-400">Safety Cap:</span> <strong className="text-zinc-900">5.0d</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Scenario Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SCENARIOS.map((scenario) => {
              const isRunning = runningId === scenario.id;
              const result = results[scenario.id];
              const succeeded = result && 'caseId' in result ? result : null;
              const failed = result && 'error' in result ? result : null;

              return (
                <div
                  key={scenario.id}
                  className="bg-white border border-zinc-200/90 rounded-xl p-5.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                          {scenario.icon}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {scenario.category}
                          </span>
                          <h3 className="font-bold text-zinc-900 text-base mt-1 tracking-tight">
                            {scenario.title}
                          </h3>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60 shrink-0">
                        {scenario.badge}
                      </span>
                    </div>

                    {/* Disruption Description */}
                    <p className="text-xs text-zinc-600 leading-relaxed mb-3.5">
                      {scenario.description}
                    </p>

                    {/* Expected Engine Behavior */}
                    <div className="bg-zinc-50/80 rounded-lg p-3 border border-zinc-100 mb-4 space-y-1.5 text-xs">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                        Expected Engine Behavior
                      </div>
                      <p className="text-zinc-700 font-medium text-[11px] leading-snug">
                        {scenario.expectedBehavior}
                      </p>
                      <div className="text-[10px] text-zinc-400 font-mono pt-1 border-t border-zinc-100">
                        Ref: {scenario.psReference}
                      </div>
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
                        onClick={() => setOpenCaseId(succeeded.caseId)}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-2 text-xs font-bold transition-colors hover:bg-emerald-100"
                      >
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>Inspect Live Case ({succeeded.caseId})</span>
                        <ArrowUpRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footnote */}
          <div className="p-4 bg-white rounded-xl border border-zinc-200/70 text-xs text-zinc-500 space-y-1">
            <p className="font-semibold text-zinc-800">Deterministic Store Execution</p>
            <p className="leading-relaxed">
              Every scenario mutates the real in-memory/Postgres data store and runs the FSM cycle. Running multiple disruptions in sequence attaches to the active case on <span className="font-mono text-zinc-700 font-medium">COMP-ALPHA</span>, demonstrating concurrent disruption handling and multi-version replanning (<span className="font-mono text-zinc-700">V1 → V2</span>).
            </p>
          </div>
        </div>
      </div>

      {openCaseId && <CaseDetailOverlay caseId={openCaseId} onClose={() => setOpenCaseId(null)} />}
    </div>
  );
}