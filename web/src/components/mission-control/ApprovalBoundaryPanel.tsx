// PRD §21/Figure 1 — "HUMAN APPROVAL BOUNDARY: purchases over threshold or
// policy-flagged actions cannot cross without ApprovalRequest = APPROVED." This
// is the one hard gate in the whole system; it gets its own dedicated section,
// not just a modal.
import type { ApprovalRequest } from "@nexus/shared/types/validation";
import { Panel } from "./Panel";
import { StatusPill, approvalStatusTone } from "./StatusPill";

export function ApprovalBoundaryPanel({
  approvalRequest,
  decision,
  onApprove,
  onReject,
  onOpenModal,
  disabled = false
}: {
  approvalRequest: ApprovalRequest;
  decision: ApprovalRequest["status"];
  onApprove: () => void;
  onReject: () => void;
  onOpenModal?: () => void;
  /**
   * True only during the brief window after a judge event has been triggered
   * but before the live case has loaded — the panel shown at that instant is
   * still the static demo fixture's, and clicking its controls would silently
   * act on stale content instead of the incoming live one. Disables Review
   * Approval / Approve / Reject until that window closes.
   */
  disabled?: boolean;
}): React.ReactElement {
  return (
    <Panel
      title="Human Approval Boundary"
      subtitle="Only entry/exit point requiring a human ApprovalRequest decision (§21)"
      tone="primary"
      className={decision === "PENDING" ? "border-amber-900/60" : ""}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">Request {approvalRequest.id}</span>
        <StatusPill label={decision} tone={approvalStatusTone(decision)} />
      </div>

      {decision === "PENDING" && onOpenModal && (
        <button
          onClick={onOpenModal}
          disabled={disabled}
          className="mb-4 flex w-full items-center justify-between rounded border border-amber-700 bg-amber-900/30 px-3 py-2.5 text-left hover:bg-amber-900/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-amber-900/30"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-300">Human action required</span>
          <span className="rounded bg-amber-600 px-2.5 py-1 text-xs font-semibold text-amber-950">Review Approval</span>
        </button>
      )}
      {disabled && (
        <p className="mb-4 text-[11px] text-sky-400">Starting live run — controls re-enable once the live case loads.</p>
      )}

      <p className="mb-4 text-sm leading-relaxed text-slate-300">{approvalRequest.brief}</p>
      <p className="mb-4 text-[11px] text-slate-600">Decision brief — static demo content, not a live model output.</p>

      {decision === "PENDING" ? (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={disabled}
            className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-emerald-700"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            disabled={disabled}
            className="rounded bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-700"
          >
            Reject
          </button>
          <span className="self-center text-[11px] text-slate-600">demo shell — recorded locally, not persisted</span>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Resolved locally in this demo shell as {decision}.</p>
      )}
    </Panel>
  );
}
