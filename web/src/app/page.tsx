"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface DashboardCase {
  id: string;
  status: string;
  priority: string;
  continuityImpact: { unitsAtRisk: number; deadlineBreached: boolean };
  activePlanVersion: number;
  replanCount: number;
}

interface DashboardSummary {
  kpis: {
    coverageDaysRemaining: number | null;
    ordersAtRiskCount: number;
    unitsAtRisk: number;
    deadlinesBreachedCount: number;
    emergencyBudgetRemaining: number;
  };
  cases: DashboardCase[];
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  expected: number | string;
  actual: number | string;
}

interface AuditEvent {
  id: string;
  cycle: number;
  timestamp: string;
  actor: string;
  type: string;
  summary: string;
}

interface CaseDetail {
  case: DashboardCase & { id: string };
  agentState: { currentStep: string; cycle: number; toolCallCount: number; lastToolCalls: string[] } | null;
  activePlanVersion: {
    version: number;
    plan: { allocations: { supplierId: string; qty: number; unitPrice: number }[]; totalCost: number; expectedDeliveryDate: string };
    invalidated_assumptions: string[];
    carried_forward_actions: string[];
    reason_for_change: string;
  } | null;
  latestValidationResult: { checks: ValidationCheck[]; overallPassed: boolean; withinApprovalThreshold: boolean } | null;
  pendingApproval: { id: string; brief: string; status: string } | null;
  doNothingVsNexus: {
    doNothing: { coverageDays: number | null; deadlineBreached: boolean; unitsAtRisk: number; costImpact: number };
    nexusPlan: { coverageDays: number | null; deadlineBreached: boolean; unitsAtRisk: number; costImpact: number };
  } | null;
  auditEvents: AuditEvent[];
}

const POLL_MS = 4000;
const ORIGINAL_PO_ID = "po-1001";

function StatusBadge({ status }: { status: string }): React.ReactElement {
  const color =
    status === "GOAL_ACHIEVED"
      ? "bg-emerald-600"
      : status === "NO_FEASIBLE_RECOVERY"
        ? "bg-red-700"
        : status === "HUMAN_ESCALATED_AWAITING_DECISION"
          ? "bg-amber-600"
          : "bg-sky-700";
  return <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${color}`}>{status}</span>;
}

export default function Page(): React.ReactElement {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      await fetch("/api/agent/tick", { method: "POST" });
      const summaryRes = await fetch("/api/dashboard/summary");
      const summaryJson: DashboardSummary = await summaryRes.json();
      setSummary(summaryJson);

      const activeCaseId = selectedCaseId ?? summaryJson.cases[0]?.id ?? null;
      if (activeCaseId) {
        setSelectedCaseId(activeCaseId);
        const detailRes = await fetch(`/api/cases/${activeCaseId}`);
        if (detailRes.ok) setDetail(await detailRes.json());
      } else {
        setDetail(null);
      }
      setLastError(null);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
    }
  }, [selectedCaseId]);

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refresh]);

  async function triggerShipmentDelay(): Promise<void> {
    setBusy(true);
    try {
      const res = await fetch("/api/agent/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "SHIPMENT_DELAY", payload: { poId: ORIGINAL_PO_ID, delayHours: 24 } })
      });
      const json = await res.json();
      if (json.caseId) setSelectedCaseId(json.caseId);
      await refresh();
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function resolveApproval(approvalId: string, decision: "APPROVED" | "REJECTED"): Promise<void> {
    setBusy(true);
    try {
      await fetch(`/api/approvals/${approvalId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, resolvedBy: "ops-controller@nexus" })
      });
      await refresh();
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const kpis = summary?.kpis;
  const productionStatus =
    (kpis?.deadlinesBreachedCount ?? 0) > 0
      ? "BREACHED"
      : (kpis?.ordersAtRiskCount ?? 0) > 0
        ? "AT RISK"
        : "PROTECTED";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">NEXUS Mission Control</h1>
          <p className="text-sm text-slate-400">Is production protected?</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <Stat label="Production Status" value={productionStatus} />
          <Stat label="Orders At Risk" value={String(kpis?.ordersAtRiskCount ?? 0)} />
          <Stat label="Units At Risk" value={String(kpis?.unitsAtRisk ?? 0)} />
          <Stat label="Deadlines Breached" value={String(kpis?.deadlinesBreachedCount ?? 0)} />
          <Stat label="Emergency Budget Remaining" value={`₹${(kpis?.emergencyBudgetRemaining ?? 0).toLocaleString()}`} />
        </div>
        <button
          onClick={triggerShipmentDelay}
          disabled={busy}
          className="rounded bg-orange-600 px-3 py-1.5 text-sm font-medium hover:bg-orange-500 disabled:opacity-50"
        >
          Judge Event: Shipment Delayed 24h
        </button>
      </header>

      {lastError && (
        <div className="border-b border-red-900 bg-red-950 px-6 py-2 text-sm text-red-300">Error: {lastError}</div>
      )}

      <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-3">
        <section className="rounded border border-slate-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Cases</h2>
          <ul className="space-y-2">
            {(summary?.cases ?? []).map((c) => (
              <li
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className={`cursor-pointer rounded border p-2 text-sm ${c.id === selectedCaseId ? "border-sky-600 bg-slate-900" : "border-slate-800"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400">{c.id.slice(0, 12)}</span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {c.priority} · units at risk {c.continuityImpact.unitsAtRisk} · v{c.activePlanVersion} · replans {c.replanCount}
                </div>
              </li>
            ))}
            {(!summary || summary.cases.length === 0) && (
              <li className="text-sm text-slate-500">No active cases. Trigger the judge event above.</li>
            )}
          </ul>
        </section>

        <section className="rounded border border-slate-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Live Agent Trace</h2>
          {detail?.agentState ? (
            <div className="mb-3 text-sm">
              <div>
                Current step: <StatusBadge status={detail.agentState.currentStep} />
              </div>
              <div className="mt-1 text-xs text-slate-400">
                cycle {detail.agentState.cycle} · toolCallCount {detail.agentState.toolCallCount}/12
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a case to see its trace.</p>
          )}
          <ol className="max-h-96 space-y-1 overflow-y-auto text-xs">
            {(detail?.auditEvents ?? [])
              .slice()
              .reverse()
              .map((e) => (
                <li key={e.id} className="border-b border-slate-900 py-1">
                  <span className="text-slate-500">[{e.type}]</span> {e.summary}
                </li>
              ))}
          </ol>

          {detail?.pendingApproval && (
            <div className="mt-4 rounded border border-amber-700 bg-amber-950 p-3 text-sm">
              <p className="mb-2 font-semibold text-amber-300">Human approval required</p>
              <p className="mb-3 text-xs text-amber-200">{detail.pendingApproval.brief}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => resolveApproval(detail.pendingApproval!.id, "APPROVED")}
                  disabled={busy}
                  className="rounded bg-emerald-700 px-3 py-1 text-xs font-medium hover:bg-emerald-600 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => resolveApproval(detail.pendingApproval!.id, "REJECTED")}
                  disabled={busy}
                  className="rounded bg-red-700 px-3 py-1 text-xs font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded border border-slate-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Plan &amp; Validator</h2>
          {detail?.activePlanVersion ? (
            <div className="mb-3 text-sm">
              <p className="text-xs text-slate-400">Plan v{detail.activePlanVersion.version}</p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {detail.activePlanVersion.plan.allocations.map((a, i) => (
                  <li key={i}>
                    {a.qty} units from {a.supplierId} @ ₹{a.unitPrice}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs">Total cost: ₹{detail.activePlanVersion.plan.totalCost.toLocaleString()}</p>
              {detail.activePlanVersion.reason_for_change !== "initial plan proposal" && (
                <p className="mt-1 text-xs text-slate-400">Reason for change: {detail.activePlanVersion.reason_for_change}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No plan proposed yet.</p>
          )}

          {detail?.latestValidationResult && (
            <ul className="mb-4 space-y-1 text-xs">
              {detail.latestValidationResult.checks.map((c) => (
                <li key={c.name} className="flex items-center justify-between border-b border-slate-900 py-1">
                  <span>{c.name}</span>
                  <span className={c.passed ? "text-emerald-400" : "text-red-400"}>{c.passed ? "PASS" : "FAIL"}</span>
                </li>
              ))}
            </ul>
          )}

          {detail?.doNothingVsNexus && (
            <div>
              <h3 className="mb-1 text-xs font-semibold text-slate-300">Do-Nothing vs NEXUS Plan</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left font-normal"></th>
                    <th className="text-left font-normal">Do Nothing</th>
                    <th className="text-left font-normal">NEXUS Plan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Deadline breached</td>
                    <td>{detail.doNothingVsNexus.doNothing.deadlineBreached ? "Yes" : "No"}</td>
                    <td>{detail.doNothingVsNexus.nexusPlan.deadlineBreached ? "Yes" : "No"}</td>
                  </tr>
                  <tr>
                    <td>Units at risk</td>
                    <td>{detail.doNothingVsNexus.doNothing.unitsAtRisk}</td>
                    <td>{detail.doNothingVsNexus.nexusPlan.unitsAtRisk}</td>
                  </tr>
                  <tr>
                    <td>Cost impact</td>
                    <td>₹{detail.doNothingVsNexus.doNothing.costImpact.toLocaleString()}</td>
                    <td>₹{detail.doNothingVsNexus.nexusPlan.costImpact.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div>
      <div className="text-slate-500">{label}</div>
      <div className="font-mono text-slate-100">{value}</div>
    </div>
  );
}
