import type { ApprovalRequest } from "@nexus/shared/types/validation";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";
import { ShieldAlert, CheckCircle2, ArrowRight, Lock } from "lucide-react";

export function ApprovalBoundaryPanel({
  approvalRequest,
  decision,
  onApprove,
  onReject,
  onOpenModal,
  disabled = false
}: {
  approvalRequest: ApprovalRequest;
  decision: "PENDING" | "APPROVED" | "REJECTED";
  onApprove: () => void;
  onReject: () => void;
  onOpenModal?: () => void;
  disabled?: boolean;
}): React.ReactElement {
  return (
    <Panel
      title="Human Escalation & Governance Boundary"
      subtitle="Autonomous execution paused pending human sign-off per organizational policy"
      tone="warning"
      headerRight={
        <StatusPill
          label={decision}
          dot={decision === "PENDING"}
          tone={decision === "APPROVED" ? "success" : decision === "REJECTED" ? "danger" : "warning"}
        />
      }
    >
      <div className="space-y-4">
        {/* Escalation Justification Card */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
            <Lock size={14} className="text-amber-700" />
            <span>Escalation Rule Triggered (Policy Boundary):</span>
          </div>
          <p className="text-amber-950 font-medium leading-relaxed">{approvalRequest.brief}</p>
          <div className="mt-2.5 flex items-center gap-6 font-mono text-[11px] text-amber-800 border-t border-amber-200/80 pt-2">
            <span>
              Request ID: <strong>{approvalRequest.id}</strong>
            </span>
            <span>
              Governance Threshold: <strong>₹10,000</strong>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          {decision === "PENDING" ? (
            <>
              {onOpenModal && (
                <button
                  onClick={onOpenModal}
                  disabled={disabled}
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-50 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Examine Decision Context & Sign-off Modal</span>
                  <ArrowRight size={13} />
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={onReject}
                  disabled={disabled}
                  className="cursor-pointer px-4 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reject Plan
                </button>
                <button
                  onClick={onApprove}
                  disabled={disabled}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-2xs hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={14} />
                  <span>Authorize & Dispatch Recovery</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>
                Escalation resolved as <strong className="text-zinc-900">{decision}</strong>. Decision recorded in audit trail.
              </span>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}