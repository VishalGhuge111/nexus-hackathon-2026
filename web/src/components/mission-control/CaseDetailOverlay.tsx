'use client';

// Real case-detail view: fetches GET /api/cases/:id (shared/agent/fsm.ts's actual
// output, not a fixture) and composes the already-existing mission-control panels
// against that live shape. Polls while open so an in-progress case (VERIFY -> PLAN
// -> VALIDATE -> ...) visibly advances; POST /api/agent/tick on each poll is the
// same call the Vercel cron makes in production (see vercel.json) — there is no
// cron running in local dev, so this is what actually drives the agent loop here.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { fetchCaseDetail, resolveApproval, type CaseDetail } from '@/lib/api-client';
import { DemoDataBanner } from './DemoDataBanner';
import { StatusPill, caseStatusTone } from './StatusPill';
import { RiskImpactSummary } from './RiskImpactSummary';
import { LiveAgentTracePanel } from './LiveAgentTracePanel';
import { RecoveryPlanPanel } from './RecoveryPlanPanel';
import { PlanVersionLineage } from './PlanVersionLineage';
import { ApprovalBoundaryPanel } from './ApprovalBoundaryPanel';
import { EscalationModal } from './EscalationModal';
import { AuditTimeline } from './AuditTimeline';

const TERMINAL_STATUSES = new Set(['GOAL_ACHIEVED', 'NO_FEASIBLE_RECOVERY']);
const POLL_MS = 2500;

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-slate-400">{caseId}</span>
          {detail && (
            <>
              <StatusPill label={detail.caseRecord.status.replace(/_/g, ' ')} tone={caseStatusTone(detail.caseRecord.status)} />
              <span className="text-xs text-slate-500">{detail.caseRecord.priority}</span>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
          aria-label="Close case detail"
        >
          <X size={18} />
        </button>
      </div>

      <DemoDataBanner live />

      {error && (
        <div className="border-b border-red-900 bg-red-950/60 px-6 py-1.5 text-xs text-red-300">Error: {error}</div>
      )}

      {!detail ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Loading case {caseId}…
        </div>
      ) : (
        <div className="mx-auto max-w-[1600px] px-6 py-6">
          <div className="mb-3 text-[11px] font-semibold tracking-widest text-slate-600 uppercase">Active incident</div>
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            <div className="space-y-5">
              <RiskImpactSummary
                riskSignals={detail.caseRecord.riskSignals}
                unitsAtRisk={detail.caseRecord.continuityImpact.unitsAtRisk}
                deadlineBreached={detail.caseRecord.continuityImpact.deadlineBreached}
              />
              {detail.agentState && (
                <LiveAgentTracePanel agentState={detail.agentState} auditEvents={detail.auditEvents} />
              )}
            </div>

            <div className="space-y-5">
              {detail.activePlanVersion && detail.latestValidationResult && detail.doNothingVsNexus ? (
                <RecoveryPlanPanel
                  activePlanVersion={detail.activePlanVersion}
                  validationResult={detail.latestValidationResult}
                  comparison={detail.doNothingVsNexus}
                />
              ) : (
                <p className="rounded-lg border border-slate-800 p-4 text-sm text-slate-500">
                  No recovery plan proposed yet.
                </p>
              )}
              {detail.planVersions.length > 0 && <PlanVersionLineage versions={detail.planVersions} />}
            </div>
          </div>

          {detail.pendingApproval && (
            <div className="mt-5">
              <ApprovalBoundaryPanel
                approvalRequest={detail.pendingApproval}
                decision={detail.pendingApproval.status}
                onApprove={() => handleDecision('APPROVED')}
                onReject={() => handleDecision('REJECTED')}
                onOpenModal={() => setModalOpen(true)}
                disabled={resolving}
                isLive
              />
            </div>
          )}

          <div className="mt-10 border-t border-slate-900 pt-6">
            <div className="mb-3 text-[11px] font-semibold tracking-widest text-slate-600 uppercase">Audit &amp; activity</div>
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
          isLive
        />
      )}
    </div>
  );
}
