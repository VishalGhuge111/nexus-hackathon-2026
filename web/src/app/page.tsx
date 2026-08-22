"use client";

// NEXUS Mission Control (PRD §28).
//
// Two modes, switched by triggering the live event:
//  - STATIC (default): renders the fixed, deterministic demo fixture in
//    web/src/lib/missionControl/demoFixture.ts — a curated illustration of
//    the full golden path (including a genuine Validator-computed V1 failure
//    and V2 pass), useful as a rehearsed fallback.
//  - LIVE: once "Shipment Delayed 24h" is clicked, the page calls the real
//    /api/agent/event + /api/agent/tick + /api/approvals/:id/resolve routes
//    (see web/src/app/api/**, backed by shared/agent/fsm.ts) and polls
//    /api/cases/:id. This is the real deterministic agent — same fixture data,
//    same stub LLM, no randomness — not a simulation of the UI.
//
// Level 2 panels (Inventory & Coverage, Suppliers & Shipments) always show the
// static reference fixture even in live mode: the live API doesn't expose a
// per-supplier eligibility breakdown, and inventing one here would misrepresent
// suppliers (the static fixture's third supplier, QuickSource, doesn't exist in
// the live backend's fixture) — see CLAUDE.md for the full breakdown of what's
// genuinely live vs. illustrative.

import { useCallback, useEffect, useRef, useState } from "react";
import { DemoDataBanner } from "@/components/mission-control/DemoDataBanner";
import { TopStatusBar, type ProductionStatus } from "@/components/mission-control/TopStatusBar";
import { JudgeControlStrip } from "@/components/mission-control/JudgeControlStrip";
import { CaseListPanel } from "@/components/mission-control/CaseListPanel";
import { LiveAgentTracePanel } from "@/components/mission-control/LiveAgentTracePanel";
import { RiskImpactSummary } from "@/components/mission-control/RiskImpactSummary";
import { InventoryCoveragePanel } from "@/components/mission-control/InventoryCoveragePanel";
import { SupplierShipmentPanel } from "@/components/mission-control/SupplierShipmentPanel";
import { RecoveryPlanPanel } from "@/components/mission-control/RecoveryPlanPanel";
import { ApprovalBoundaryPanel } from "@/components/mission-control/ApprovalBoundaryPanel";
import { EscalationModal } from "@/components/mission-control/EscalationModal";
import { PlanVersionLineage } from "@/components/mission-control/PlanVersionLineage";
import { AuditTimeline } from "@/components/mission-control/AuditTimeline";
import type { Case } from "@nexus/shared/types/case";
import type { AgentState } from "@nexus/shared/types/agent";
import type { RecoveryPlanVersion, PurchaseOrder } from "@nexus/shared/types/procurement";
import type { ValidationResult, ApprovalRequest } from "@nexus/shared/types/validation";
import type { AuditEvent } from "@nexus/shared/types/audit";
import type { ScenarioResult } from "@/components/mission-control/DoNothingVsNexus";
import { ORIGINAL_PO_ID } from "@nexus/shared/db/demoSeed";

import {
  cases as staticCases,
  primaryCase,
  agentState as staticAgentState,
  auditEvents as staticAuditEvents,
  riskSignals as staticRiskSignals,
  inventoryRecord,
  coverage,
  safetyStock,
  productionRequirementQty,
  supplierEligibility,
  purchaseOrders as staticPurchaseOrders,
  planVersions as staticPlanVersions,
  v2ValidationResult,
  approvalRequest as staticApprovalRequest,
  doNothingVsNexus as staticDoNothingVsNexus,
  kpis as staticKpis
} from "@/lib/missionControl/demoFixture";

const TERMINAL_STATUSES = new Set(["GOAL_ACHIEVED", "NO_FEASIBLE_RECOVERY"]);
const POLL_MS = 2000;

interface LiveDetail {
  case: Case;
  agentState: AgentState | null;
  activePlanVersion: (RecoveryPlanVersion & { id: string }) | null;
  planVersions: (RecoveryPlanVersion & { id: string })[];
  latestValidationResult: ValidationResult | null;
  pendingApproval: ApprovalRequest | null;
  purchaseOrders: PurchaseOrder[];
  doNothingVsNexus: { doNothing: ScenarioResult; nexusPlan: ScenarioResult } | null;
  auditEvents: AuditEvent[];
}

function deriveProductionStatus(deadlinesBreachedCount: number, ordersAtRiskCount: number): ProductionStatus {
  if (deadlinesBreachedCount > 0) return "BREACHED";
  if (ordersAtRiskCount > 0) return "AT_RISK";
  return "PROTECTED";
}

export default function Page(): React.ReactElement {
  // Static-mode local state (unchanged behavior when no live case is running).
  const [selectedCaseId, setSelectedCaseId] = useState<string>(primaryCase.id);
  const [staticApprovalDecision, setStaticApprovalDecision] = useState<ApprovalRequest["status"]>(
    staticApprovalRequest.status
  );

  // Live-mode state.
  // True only from the moment "Shipment Delayed 24h" is clicked until the live
  // case has actually loaded (isLive flips true). During that window the panel
  // still visibly showing is the static demo fixture's — this guards its
  // Review Approval / Approve / Reject controls so a click can't silently act
  // on stale static content instead of the incoming live case.
  const [isTriggering, setIsTriggering] = useState(false);
  const [liveCaseId, setLiveCaseId] = useState<string | null>(null);
  const [liveDetail, setLiveDetail] = useState<LiveDetail | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [cachedApproval, setCachedApproval] = useState<ApprovalRequest | null>(null);
  const [liveResolvedDecision, setLiveResolvedDecision] = useState<ApprovalRequest["status"] | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Every fetchLiveDetail call claims the next number here before awaiting its
  // GET. Concurrent callers (the poll loop and resolveLiveApproval's own
  // post-resolve refresh) can have responses arrive out of send order —
  // observed directly in network capture, e.g. a slow first-hit dev-server
  // compile on an infrequently-called route delaying one response behind a
  // later-sent one. Only the response whose claimed number is still the
  // latest issued is applied; an older one that resolves late is discarded.
  const latestLiveRequestIdRef = useRef(0);

  // The escalation modal never auto-opens (fixed regression from an earlier
  // pass) — it only opens via the explicit "Review Approval" CTA.
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const isLive = liveCaseId !== null;

  const fetchLiveDetail = useCallback(async (caseId: string) => {
    const requestId = ++latestLiveRequestIdRef.current;
    const res = await fetch(`/api/cases/${caseId}`);
    if (!res.ok) return;
    const detail: LiveDetail = await res.json();
    if (requestId !== latestLiveRequestIdRef.current) return;
    setLiveDetail(detail);
    if (detail.pendingApproval) setCachedApproval(detail.pendingApproval);
  }, []);

  useEffect(() => {
    if (!liveCaseId) return;
    let cancelled = false;

    async function pollOnce(): Promise<void> {
      try {
        await fetch("/api/agent/tick", { method: "POST" });
        if (cancelled) return;
        await fetchLiveDetail(liveCaseId!);
      } catch (err) {
        if (!cancelled) setLiveError(err instanceof Error ? err.message : String(err));
      }
    }

    pollOnce();
    pollRef.current = setInterval(() => {
      if (liveDetail && TERMINAL_STATUSES.has(liveDetail.case.status)) {
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      pollOnce();
    }, POLL_MS);

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveCaseId, fetchLiveDetail]);

  async function triggerShipmentDelay(): Promise<void> {
    setIsTriggering(true);
    setLiveError(null);
    setLiveResolvedDecision(null);
    setCachedApproval(null);
    setModalOpen(false);
    try {
      const res = await fetch("/api/agent/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "SHIPMENT_DELAY", payload: { poId: ORIGINAL_PO_ID, delayHours: 24 } })
      });
      const json = await res.json();
      if (!res.ok || !json.caseId) {
        setLiveError(json.error ?? "Failed to trigger event");
        return;
      }
      setLiveCaseId(json.caseId);
      await fetchLiveDetail(json.caseId);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsTriggering(false);
    }
  }

  async function resolveLiveApproval(decision: "APPROVED" | "REJECTED"): Promise<void> {
    if (!cachedApproval) return;
    setLiveResolvedDecision(decision);
    try {
      await fetch(`/api/approvals/${cachedApproval.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, resolvedBy: "judge-demo" })
      });
      if (liveCaseId) await fetchLiveDetail(liveCaseId);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : String(err));
    }
  }

  // ---- Assemble the values every panel below actually reads ----
  const displayCases: Case[] = isLive ? (liveDetail ? [liveDetail.case] : []) : staticCases;
  const displayAgentState = isLive ? liveDetail?.agentState ?? null : staticAgentState;
  const displayAuditEvents = isLive ? liveDetail?.auditEvents ?? [] : staticAuditEvents;
  const displayPlanVersions = isLive ? liveDetail?.planVersions ?? [] : staticPlanVersions;
  const displayActivePlanVersion = isLive ? liveDetail?.activePlanVersion ?? null : staticPlanVersions.find((v) => v.status === "ACTIVE")!;
  const displayValidationResult = isLive ? liveDetail?.latestValidationResult ?? null : v2ValidationResult;
  const displayApprovalRequest = isLive ? cachedApproval : staticApprovalRequest;
  const displayApprovalDecision: ApprovalRequest["status"] | null = isLive
    ? (liveDetail?.pendingApproval ? "PENDING" : liveResolvedDecision)
    : staticApprovalDecision;
  const displayRiskSignals = isLive ? liveDetail?.case.riskSignals ?? [] : staticRiskSignals;
  const displayUnitsAtRisk = isLive ? liveDetail?.case.continuityImpact.unitsAtRisk ?? 0 : primaryCase.continuityImpact.unitsAtRisk;
  const displayDeadlineBreached = isLive
    ? liveDetail?.case.continuityImpact.deadlineBreached ?? false
    : primaryCase.continuityImpact.deadlineBreached;

  const kpis = isLive
    ? {
        coverageDaysRemaining: staticKpis.coverageDaysRemaining, // single-SKU simplification, same as the live /api/dashboard/summary route
        ordersAtRiskCount: displayUnitsAtRisk > 0 ? 1 : 0,
        unitsAtRisk: displayUnitsAtRisk,
        deadlinesBreachedCount: displayDeadlineBreached ? 1 : 0,
        emergencyBudgetRemaining: staticKpis.emergencyBudgetRemaining
      }
    : staticKpis;

  const hasStory = isLive ? liveDetail !== null : selectedCaseId === primaryCase.id;
  const showPlanAndApproval = isLive
    ? displayActivePlanVersion !== null && displayValidationResult !== null
    : hasStory;
  const showApprovalPanel = isLive ? displayApprovalRequest !== null && displayApprovalDecision !== null : hasStory;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <DemoDataBanner live={isLive} />

      <div className="border-b border-slate-800">
        <TopStatusBar
          productionStatus={deriveProductionStatus(kpis.deadlinesBreachedCount, kpis.ordersAtRiskCount)}
          coverageDaysRemaining={kpis.coverageDaysRemaining ?? 0}
          ordersAtRiskCount={kpis.ordersAtRiskCount}
          unitsAtRisk={kpis.unitsAtRisk}
          deadlinesBreachedCount={kpis.deadlinesBreachedCount}
          emergencyBudgetRemaining={kpis.emergencyBudgetRemaining}
        />
      </div>

      {liveError && (
        <div className="border-b border-red-900 bg-red-950/60 px-6 py-1.5 text-xs text-red-300">Error: {liveError}</div>
      )}

      <div className="mx-auto max-w-[2200px] px-6 py-6">
        {/* LEVEL 1 — the demo story: active incident, agent state, recovery plan, approval boundary */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[280px_1fr_420px] md:gap-6">
          <div className="space-y-5">
            <CaseListPanel
              cases={displayCases}
              selectedCaseId={isLive ? liveCaseId : selectedCaseId}
              onSelect={isLive ? () => {} : setSelectedCaseId}
            />
          </div>

          <div className="space-y-5">
            {hasStory ? (
              <>
                <RiskImpactSummary
                  riskSignals={displayRiskSignals}
                  unitsAtRisk={displayUnitsAtRisk}
                  deadlineBreached={displayDeadlineBreached}
                />
                {displayAgentState && <LiveAgentTracePanel agentState={displayAgentState} auditEvents={displayAuditEvents} />}
              </>
            ) : (
              <p className="rounded border border-slate-800 p-4 text-sm text-slate-500">
                {isLive ? "Waiting for the first agent cycle…" : "Select the active case above."}
              </p>
            )}
          </div>

          <div className="space-y-5">
            {showPlanAndApproval && displayActivePlanVersion && displayValidationResult ? (
              <RecoveryPlanPanel
                activePlanVersion={displayActivePlanVersion}
                validationResult={displayValidationResult}
                comparison={(isLive ? liveDetail?.doNothingVsNexus : null) ?? staticDoNothingVsNexus}
              />
            ) : (
              <p className="rounded border border-slate-800 p-4 text-sm text-slate-500">
                {isLive ? "No recovery plan proposed yet." : "No plan for this case yet."}
              </p>
            )}
            {showApprovalPanel && displayApprovalRequest && displayApprovalDecision && (
              <ApprovalBoundaryPanel
                approvalRequest={displayApprovalRequest}
                decision={displayApprovalDecision}
                onApprove={() => (isLive ? resolveLiveApproval("APPROVED") : setStaticApprovalDecision("APPROVED"))}
                onReject={() => (isLive ? resolveLiveApproval("REJECTED") : setStaticApprovalDecision("REJECTED"))}
                onOpenModal={() => setModalOpen(true)}
                disabled={isTriggering && !isLive}
                isLive={isLive}
              />
            )}
          </div>
        </div>

        {/* LEVEL 2 — supporting evidence: always the static reference fixture (see
            file header — the live API doesn't expose a per-supplier eligibility
            breakdown, and this SKU/inventory context doesn't change during the run) */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <InventoryCoveragePanel
            inventory={inventoryRecord}
            coverageDays={coverage.coverageDays}
            safetyStockRatio={safetyStock.disabled ? null : safetyStock.ratio}
            productionRequirement={productionRequirementQty}
          />
          <SupplierShipmentPanel
            supplierEligibility={supplierEligibility}
            purchaseOrders={isLive ? liveDetail?.purchaseOrders ?? [] : staticPurchaseOrders}
            disruptedSupplierId="supplier-orbital"
          />
          <PlanVersionLineage versions={isLive ? displayPlanVersions : staticPlanVersions} />
        </div>

        {/* LEVEL 3 — audit/debug: quietest, never competes with the story above */}
        <div className="mt-8 border-t border-slate-900 pt-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px]">
            <AuditTimeline auditEvents={displayAuditEvents} />
            <JudgeControlStrip onTriggerShipmentDelay={triggerShipmentDelay} disabled={isLive || isTriggering} />
          </div>
        </div>
      </div>

      {showApprovalPanel && displayApprovalRequest && (
        <EscalationModal
          open={modalOpen && displayApprovalDecision === "PENDING"}
          approvalRequest={displayApprovalRequest}
          onApprove={() => (isLive ? resolveLiveApproval("APPROVED") : setStaticApprovalDecision("APPROVED"))}
          onReject={() => (isLive ? resolveLiveApproval("REJECTED") : setStaticApprovalDecision("REJECTED"))}
          onDismiss={() => setModalOpen(false)}
          isLive={isLive}
        />
      )}
    </main>
  );
}
