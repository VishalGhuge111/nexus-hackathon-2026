"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, ArrowLeft, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusPill, caseStatusTone } from "./StatusPill";
import { IncidentFlowStepper, type FlowStep } from "./IncidentFlowStepper";
import { RiskImpactSummary } from "./RiskImpactSummary";
import { LiveAgentTracePanel } from "./LiveAgentTracePanel";
import { InventoryCoveragePanel } from "./InventoryCoveragePanel";
import { SupplierShipmentPanel } from "./SupplierShipmentPanel";
import { SupplierCommunicationPanel } from "./SupplierCommunicationPanel";
import { RecoveryPlanPanel } from "./RecoveryPlanPanel";
import { PlanVersionLineage } from "./PlanVersionLineage";
import { ApprovalBoundaryPanel } from "./ApprovalBoundaryPanel";
import { AuditTimeline } from "./AuditTimeline";
import { EscalationModal } from "./EscalationModal";
import { fetchCaseDetail, resolveApproval, type CaseDetail } from "@/lib/api-client";
import { coverageDays as computeCoverageDays, safetyStockRisk, productionRequirement as computeProductionRequirement } from "@nexus/shared/calculations";
import type { RfqResponse } from "@nexus/shared/types/procurement";

const POLL_MS = 2500;
const TERMINAL_STATUSES = new Set(["GOAL_ACHIEVED", "NO_FEASIBLE_RECOVERY"]);

function buildFlowSteps(detail: CaseDetail): FlowStep[] {
  const { caseRecord, agentState, activePlanVersion, latestValidationResult, pendingApproval, auditEvents, planVersions } = detail;
  const done = TERMINAL_STATUSES.has(caseRecord.status);

  const approvalRequired =
    pendingApproval !== null ||
    caseRecord.status === "HUMAN_ESCALATED_AWAITING_DECISION" ||
    auditEvents.some((e) => e.type === "HUMAN_ACTION");

  return [
    {
      key: "risk",
      label: "Disruption Detected",
      state: "done",
      note: `${caseRecord.continuityImpact.unitsAtRisk} units at risk`
    },
    {
      key: "verify",
      label: "Signal Verified",
      state: caseRecord.status === "VERIFY" ? "current" : "done",
      note: "Ground truth confirmed"
    },
    {
      key: "plan",
      label: "Recovery Plan Generated",
      state: caseRecord.status === "PLAN" ? "current" : activePlanVersion ? "done" : "pending",
      note: activePlanVersion
        ? `v${activePlanVersion.version}${planVersions.length > 1 ? ` of ${planVersions.length}` : ""}`
        : undefined
    },
    {
      key: "validate",
      label: "Constraints Validated",
      state:
        caseRecord.status === "VALIDATE" ? "current" : latestValidationResult ? "done" : "pending",
      note: latestValidationResult
        ? latestValidationResult.overallPassed
          ? "8/8 passed"
          : "Rejection — replanning"
        : undefined
    },
    {
      key: "approval",
      label: "Governance Boundary",
      state:
        !approvalRequired
          ? activePlanVersion
            ? "done"
            : "pending"
          : pendingApproval
          ? "current"
          : "done",
      note: !approvalRequired ? undefined : pendingApproval ? "Awaiting decision" : "Resolved"
    },
    {
      key: "outcome",
      label: done ? (caseRecord.status === "NO_FEASIBLE_RECOVERY" ? "Recovery Failed" : "Production Protected") : "Outcome",
      state: done ? "done" : caseRecord.status === "VERIFY_OUTCOME" ? "current" : "pending",
      note: done ? caseRecord.status.replace(/_/g, " ") : undefined
    }
  ];
}

function CaseDetailSkeleton(): React.ReactElement {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function CaseDetailOverlay({
  caseId,
  onClose
}: {
  caseId: string;
  onClose: () => void;
}): React.ReactElement {
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const latestRequestIdRef = useRef(0);

  const refresh = useCallback(async (id: string) => {
    const requestId = ++latestRequestIdRef.current;
    try {
      const next = await fetchCaseDetail(id);
      if (requestId !== latestRequestIdRef.current) return;
      setDetail(next);
      setError(null);
    } catch (err) {
      if (requestId !== latestRequestIdRef.current) return;
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    setDetail(null);
    setError(null);
    let cancelled = false;

    async function pollOnce(): Promise<void> {
      try {
        await fetch("/api/agent/tick", { method: "POST" });
      } catch {
        // Continue
      }
      if (!cancelled) await refresh(caseId);
    }

    pollOnce();
    const timer = window.setInterval(() => {
      if (detail && TERMINAL_STATUSES.has(detail.caseRecord.status)) {
        window.clearInterval(timer);
        return;
      }
      pollOnce();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [caseId, refresh]);

  async function handleDecision(decision: "APPROVED" | "REJECTED"): Promise<void> {
    if (!detail?.pendingApproval) return;
    setResolving(true);
    try {
      await resolveApproval(detail.pendingApproval.id, decision);
      await refresh(caseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setResolving(false);
      setModalOpen(false);
    }
  }

  const flowSteps = useMemo(() => (detail ? buildFlowSteps(detail) : []), [detail]);

  const inventoryCoverage = useMemo(() => {
    if (!detail?.inventory || !detail.productionOrder) return null;
    const coverage = computeCoverageDays({
      usableStock: detail.inventory.usableStock,
      dailyUsageRate: detail.inventory.dailyUsageRate
    });
    const safety = safetyStockRisk({
      usableStock: detail.inventory.usableStock,
      safetyStockThreshold: detail.inventory.safetyStockThreshold
    });
    const requirement = computeProductionRequirement({
      plannedQty: detail.productionOrder.plannedQty,
      bomQtyPerUnit: detail.productionOrder.bomQtyPerUnit
    });
    return {
      coverageDays: coverage.coverageDays,
      safetyStockRatio: safety.disabled ? null : safety.ratio,
      productionRequirement: requirement.status === "OK" ? requirement.value : 0
    };
  }, [detail]);

  const rfqResponses = useMemo(() => {
    const map: Record<string, RfqResponse> = {};
    for (const rfq of detail?.rfqs ?? []) {
      for (const response of rfq.responses) map[response.supplierId] = response;
    }
    return map;
  }, [detail]);

  const supplierNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const { supplier } of detail?.supplierEligibility ?? []) map[supplier.id] = supplier.name;
    return map;
  }, [detail]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-50 text-zinc-900 select-none">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-6 lg:px-8 py-3.5 backdrop-blur shadow-2xs">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors mr-1"
            title="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          {detail && (
            <>
              <span
                className={`shrink-0 rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  detail.caseRecord.priority === "CRITICAL"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                }`}
              >
                {detail.caseRecord.priority}
              </span>
              <StatusPill
                label={detail.caseRecord.status.replace(/_/g, " ")}
                tone={caseStatusTone(detail.caseRecord.status)}
              />
            </>
          )}
          <span
            className="truncate font-mono text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60"
            title={caseId}
          >
            {caseId}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            aria-label="Close case investigation overlay"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-[1600px] mx-auto px-6 pt-4">
          <ErrorState message={error} onRetry={() => refresh(caseId)} compact />
        </div>
      )}

      {!detail ? (
        <div className="max-w-[1600px] mx-auto p-6 lg:p-8 animate-fade-in">
          <CaseDetailSkeleton />
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-6 animate-fade-in">
          {/* Narrative Stepper */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Autonomous Recovery Narrative Pipeline
            </div>
            <IncidentFlowStepper steps={flowSteps} />
          </div>

          {/* Core Decision Grid */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            {/* Left Column: What Happened & What Agent Did */}
            <div className="space-y-6">
              <RiskImpactSummary
                riskSignals={detail.caseRecord.riskSignals}
                unitsAtRisk={detail.caseRecord.continuityImpact.unitsAtRisk}
                deadlineBreached={detail.caseRecord.continuityImpact.deadlineBreached}
              />
              {detail.agentState && (
                <LiveAgentTracePanel agentState={detail.agentState} auditEvents={detail.auditEvents} />
              )}
              {inventoryCoverage && detail.inventory && (
                <InventoryCoveragePanel
                  inventory={detail.inventory}
                  coverageDays={inventoryCoverage.coverageDays}
                  safetyStockRatio={inventoryCoverage.safetyStockRatio}
                  productionRequirement={inventoryCoverage.productionRequirement}
                />
              )}
              {detail.supplierEligibility.length > 0 && (
                <SupplierShipmentPanel
                  supplierEligibility={detail.supplierEligibility}
                  purchaseOrders={detail.purchaseOrders}
                  disruptedSupplierId={detail.disruptedSupplierId}
                  rfqResponses={rfqResponses}
                />
              )}
              <SupplierCommunicationPanel messages={detail.supplierMessages} supplierNames={supplierNames} />
            </div>

            {/* Right Column: What Was Recommended & Validated */}
            <div className="space-y-6">
              {detail.activePlanVersion && detail.latestValidationResult && detail.doNothingVsNexus ? (
                <RecoveryPlanPanel
                  activePlanVersion={detail.activePlanVersion}
                  validationResult={detail.latestValidationResult}
                  comparison={detail.doNothingVsNexus}
                />
              ) : (
                <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      AI
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">Continuous Autonomous Standby</h4>
                      <p className="text-[11px] text-zinc-500">Production schedule operating within safe buffer limits</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Warehouse Usable Stock</span>
                      <p className="font-bold font-mono text-zinc-800 text-sm mt-0.5">{detail.inventory?.usableStock ?? 390} units</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Required Requirement</span>
                      <p className="font-bold font-mono text-zinc-800 text-sm mt-0.5">{detail.productionOrder ? detail.productionOrder.plannedQty * detail.productionOrder.bomQtyPerUnit : 900} units</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    When an in-transit delay or supplier disruption occurs, the NEXUS engine will immediately query alternative vendor RFQs, run 8-point deterministic validation, and formulate a multi-supplier recovery allocation.
                  </p>
                </div>
              )}
              {detail.planVersions.length > 0 && <PlanVersionLineage versions={detail.planVersions} />}
            </div>
          </div>

          {/* Human Escalation Approval Section */}
          {detail.pendingApproval && (
            <div className="mt-6">
              <ApprovalBoundaryPanel
                approvalRequest={detail.pendingApproval}
                decision={detail.pendingApproval.status}
                onApprove={() => handleDecision("APPROVED")}
                onReject={() => handleDecision("REJECTED")}
                onOpenModal={() => setModalOpen(true)}
                disabled={resolving}
              />
            </div>
          )}

          {/* Audit Timeline */}
          <div className="mt-8 border-t border-zinc-200 pt-6">
            <AuditTimeline auditEvents={detail.auditEvents} />
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {detail?.pendingApproval && (
        <EscalationModal
          open={modalOpen}
          approvalRequest={detail.pendingApproval}
          onApprove={() => handleDecision("APPROVED")}
          onReject={() => handleDecision("REJECTED")}
          onDismiss={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}