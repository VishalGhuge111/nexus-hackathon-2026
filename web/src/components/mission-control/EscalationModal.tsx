// PRD §28 — "Escalation modal: when a Case is HUMAN_ESCALATED_AWAITING_DECISION,
// a blocking-but-dismissable card shows the decision brief with Approve/Reject
// buttons."
import type { ApprovalRequest } from "@nexus/shared/types/validation";

export function EscalationModal({
  open,
  approvalRequest,
  onApprove,
  onReject,
  onDismiss
}: {
  open: boolean;
  approvalRequest: ApprovalRequest;
  onApprove: () => void;
  onReject: () => void;
  onDismiss: () => void;
}): React.ReactElement | null {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onDismiss}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded border border-amber-800 bg-slate-950 p-5 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-amber-300">Human approval required</h3>
          <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300" aria-label="Dismiss">
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-slate-300">{approvalRequest.brief}</p>
        <p className="mb-4 text-[11px] text-slate-600">Decision brief — static demo content, not a live model output.</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onApprove();
              onDismiss();
            }}
            className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
          >
            Approve
          </button>
          <button
            onClick={() => {
              onReject();
              onDismiss();
            }}
            className="rounded bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
          >
            Reject
          </button>
          <button onClick={onDismiss} className="ml-auto rounded px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
