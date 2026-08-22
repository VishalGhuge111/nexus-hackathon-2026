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
  ArrowUpRight
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
  description: string;
  icon: React.ReactNode;
  run: () => Promise<{ caseId: string }>;
  expects: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'shipment-delay',
    title: 'Shipment Delay',
    description: 'Tests the full autonomous recovery loop: risk detection, replanning after a rejected plan, and human approval.',
    icon: <Truck size={18} />,
    run: () => triggerShipmentDelay(24),
    expects: 'Golden path — the primary demo scenario.'
  },
  {
    id: 'supplier-capacity-drop',
    title: 'Supplier Capacity Drop',
    description: "Tests replanning when the original supplier's own capacity drops mid-fulfillment, real Supplier.maxCapacityPerCycle mutation.",
    icon: <Factory size={18} />,
    run: () => triggerSupplierCapacityDrop(50),
    expects: 'Eligibility re-evaluates against the reduced capacity.'
  },
  {
    id: 'demand-spike',
    title: 'Demand Spike',
    description: 'Tests early-warning sensitivity: a real +30% jump in daily component usage drops coverage days before any shipment fails.',
    icon: <TrendingUp size={18} />,
    run: () => triggerDemandSpike(30),
    expects: 'Proactive detection, not just reactive recovery.'
  },
  {
    id: 'supplier-claim-contradiction',
    title: 'Supplier Claim Contradiction',
    description: 'Tests adversarial-supplier handling: a supplier claims a shipment was dispatched while tracking shows no pickup — NEXUS verifies instead of trusting the claim.',
    icon: <ShieldAlert size={18} />,
    run: () => triggerSupplierClaimContradiction(),
    expects: 'Flagged supplier excluded from the next recovery plan, with the reason in the audit trail.'
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
      setResults((prev) => ({ ...prev, [scenario.id]: { error: err instanceof Error ? err.message : String(err) } }));
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50">
      <PageHeader
        title="Scenario Lab"
        description="Real backend disruption scenarios — each mutates real Store state and runs the actual agent loop. No scripted animations."
        icon={<FlaskConical size={20} className="text-blue-600" />}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCENARIOS.map((scenario) => {
              const isRunning = runningId === scenario.id;
              const result = results[scenario.id];
              const succeeded = result && 'caseId' in result ? result : null;
              const failed = result && 'error' in result ? result : null;

              return (
                <div key={scenario.id} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      {scenario.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900">{scenario.title}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{scenario.expects}</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 mb-4 flex-1">{scenario.description}</p>

                  {failed && (
                    <p className="text-xs text-red-600 mb-2">{failed.error}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRun(scenario)}
                      disabled={isRunning}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRunning ? <Loader2 size={15} className="animate-spin" /> : <PlayCircle size={15} />}
                      {isRunning ? 'Running…' : 'Run Scenario'}
                    </button>
                    {succeeded && (
                      <button
                        onClick={() => setOpenCaseId(succeeded.caseId)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        Open Incident <ArrowUpRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-zinc-400 max-w-2xl">
            All scenarios target the same seeded production order (<span className="font-mono">COMP-ALPHA</span>) —
            running more than one in sequence attaches to whichever case is already active for it, matching how the
            real agent handles concurrent disruptions on one production line.
          </p>
        </div>
      </div>

      {openCaseId && <CaseDetailOverlay caseId={openCaseId} onClose={() => setOpenCaseId(null)} />}
    </div>
  );
}
