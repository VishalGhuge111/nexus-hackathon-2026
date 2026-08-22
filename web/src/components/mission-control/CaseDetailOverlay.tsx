'use client';

// Real case-detail view: fetches GET /api/cases/:id (shared/agent/fsm.ts's actual
// output, not a fixture) and composes the already-existing mission-control panels
// against that live shape. Polls while open so an in-progress case (VERIFY -> PLAN
// -> VALIDATE -> ...) visibly advances; POST /api/agent/tick on each poll is the
// same call the Vercel cron makes in production (see vercel.json) — there is no
// cron running in local dev, so this is what actually drives the agent loop here.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { fetchCaseDetail, resolveApproval, type CaseDetail } from '@/lib/api-client';
import { coverageDays as computeCoverageDays, safetyStockRisk, productionRequirement as computeProductionRequirement } from '@nexus/shared/calculations';
import type { RfqResponse } from '@nexus/shared/types/procurement';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusPill, caseStatusTone } from './StatusPill';
import { RiskImpactSummary } from './RiskImpactSummary';
import { LiveAgentTracePanel } from './LiveAgentTracePanel';
import { InventoryCoveragePanel } from './InventoryCoveragePanel';
import { SupplierShipmentPanel } from './SupplierShipmentPanel';
import { RecoveryPlanPanel } from './RecoveryPlanPanel';
import { PlanVersionLineage } from './PlanVersionLineage';
import { ApprovalBoundaryPanel } from './ApprovalBoundaryPanel';
import { EscalationModal } from './EscalationModal';
import { AuditTimeline } from './AuditTimeline';
import { IncidentFlowStepper, type FlowStep } from './IncidentFlowStepper';

const TERMINAL_STATUSES = new Set(['GOAL_ACHIEVED', 'NO_FEASIBLE_RECOVERY']);
const POLL_MS = 2500;

function buildFlowSteps(detail: CaseDetail): FlowStep[] {
  const { caseRecord, agentState, activePlanVersion, latestValidationResult, pendingApproval, auditEvents, planVersions } = detail;
  const done = TERMINAL_STATUSES.has(caseRecord.status);

  const approvalRequired =
    pendingApproval !== null ||
    caseRecord.status === 'HUMAN_ESCALATED_AWAITING_DECISION' ||
    auditEvents.some((e) => e.type === 'HUMAN_ACTION');

  return [
    { key: 'risk', label: 'Risk Detected', state: 'done', note: `${caseRecord.continuityImpact.unitsAtRisk} units at risk` },
    { key: 'agent', label: 'Agent Analysis', state: agentState ? 'done' : 'current' },
    {
      key: 'plan',
      label: 'Recovery Plan',
      state: activePlanVersion ? 'done' : agentState ? 'current' : 'pending',
      note: activePlanVersion ? `v${activePlanVersion.version}${planVersions.length > 1 ? ` of ${planVersions.length}` : ''}` : undefined
    },
    {
      key: 'validate',
      label: 'Validation',
      state: latestValidationResult ? 'done' : activePlanVersion ? 'current' : 'pending',
      note: latestValidationResult ? (latestValidationResult.overallPassed ? 'Passed' : 'Failed — replanning') : undefined
    },
    {
      key: 'approval',
      label: 'Human Approval',
      state: !approvalRequired ? (activePlanVersion ? 'done' : 'pending') : pendingApproval ? 'current' : 'done',
      note: !approvalRequired ? undefined : pendingApproval ? 'Awaiting decision' : 'Resolved'
    },
    { key: 'outcome', label: 'Outcome', state: done ? 'done' : 'pending', note: done ? caseRecord.status.replace(/_/g, ' ') : undefined }
  ];
}

function CaseDetailSkeleton(): React.ReactElement {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6">
      <Skeleton className="mb-4 h-16 w-full rounded-xl" />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <Skeleton className="mb-4 h-4 w-40" />
            <Skeleton className="mb-2 h-8 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <Skeleton className="mb-4 h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <Skeleton className="mb-4 h-4 w-36" />
            <Skeleton className="mb-3 h-16 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CaseDetailOverlay({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
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
        await fetch('/api/agent/tick', { method: 'POST' });
      } catch {
        // A failed tick shouldn't stop the detail poll from still trying to render
        // whatever the case's last-known state was.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, refresh]);

  async function handleDecision(decision: 'APPROVED' | 'REJECTED'): Promise<void> {
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
      productionRequirement: requirement.status === 'OK' ? requirement.value : 0
    };
  }, [detail]);

  const rfqResponses = useMemo(() => {
    const map: Record<string, RfqResponse> = {};
    for (const rfq of detail?.rfqs ?? []) {
      for (const response of rfq.responses) map[response.supplierId] = response;
    }
    return map;
  }, [detail]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-50 text-zinc-900">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-6 py-3.5 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          {detail && (
            <>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                  detail.caseRecord.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {detail.caseRecord.priority}
              </span>
              <StatusPill label={detail.caseRecord.status.replace(/_/g, ' ')} tone={caseStatusTone(detail.caseRecord.status)} />
            </>
          )}
          <span className="truncate font-mono text-xs text-zinc-400" title={caseId}>
            {caseId}
          </span>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 cursor-pointer rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Close case detail"
        >
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="px-6 pt-4">
          <ErrorState message={error} onRetry={() => refresh(caseId)} compact />
        </div>
      )}

      {!detail ? (
        <div className="animate-fade-in">
          <CaseDetailSkeleton />
        </div>
      ) : (
        <div className="mx-auto max-w-[1600px] px-6 py-6 animate-fade-in">
          <div className="mb-3 text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">Active incident</div>

          <div className="mb-6">
            <IncidentFlowStepper steps={flowSteps} />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
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
            </div>

            <div className="space-y-6">
              {detail.activePlanVersion && detail.latestValidationResult && detail.doNothingVsNexus ? (
                <RecoveryPlanPanel
                  activePlanVersion={detail.activePlanVersion}
                  validationResult={detail.latestValidationResult}
                  comparison={detail.doNothingVsNexus}
                />
              ) : (
                <p className="rounded-xl border border-dashed border-zinc-200 bg-white p-6 text-center text-sm text-zinc-400">
                  No recovery plan proposed yet.
                </p>
              )}
              {detail.planVersions.length > 0 && <PlanVersionLineage versions={detail.planVersions} />}
            </div>
          </div>

          {detail.pendingApproval && (
            <div className="mt-6">
              <ApprovalBoundaryPanel
                approvalRequest={detail.pendingApproval}
                decision={detail.pendingApproval.status}
                onApprove={() => handleDecision('APPROVED')}
                onReject={() => handleDecision('REJECTED')}
                onOpenModal={() => setModalOpen(true)}
                disabled={resolving}
              />
            </div>
          )}

          <div className="mt-8 border-t border-zinc-200 pt-6">
            <div className="mb-3 text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">Audit &amp; activity</div>
            <AuditTimeline auditEvents={detail.auditEvents} />
          </div>
        </div>
      )}

      {detail?.pendingApproval && (
        <EscalationModal
          open={modalOpen}
          approvalRequest={detail.pendingApproval}
          onApprove={() => handleDecision('APPROVED')}
          onReject={() => handleDecision('REJECTED')}
          onDismiss={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
