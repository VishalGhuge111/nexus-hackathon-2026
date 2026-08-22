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
  onOpenModal
}: {
  approvalRequest: ApprovalRequest;
  decision: ApprovalRequest["status"];
  onApprove: () => void;
  onReject: () => void;
  onOpenModal?: () => void;
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
          className="mb-4 flex w-full items-center justify-between rounded border border-amber-700 bg-amber-900/30 px-3 py-2.5 text-left hover:bg-amber-900/50"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-300">Human action required</span>
          <span className="rounded bg-amber-600 px-2.5 py-1 text-xs font-semibold text-amber-950">Review Approval</span>
        </button>
      )}

      <p className="mb-4 text-sm leading-relaxed text-slate-300">{approvalRequest.brief}</p>
      <p className="mb-4 text-[11px] text-slate-600">Decision brief — static demo content, not a live model output.</p>

      {decision === "PENDING" ? (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            className="rounded bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
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
