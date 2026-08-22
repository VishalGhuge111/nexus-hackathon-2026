// PRD §28 — "Escalation modal: when a Case is HUMAN_ESCALATED_AWAITING_DECISION,
// a blocking-but-dismissable card shows the decision brief with Approve/Reject
// buttons."
import type { ApprovalRequest } from "@nexus/shared/types/validation";

export function EscalationModal({
  open,
  approvalRequest,
  onApprove,
  onReject,
  onDismiss,
  isLive = false
}: {
  open: boolean;
  approvalRequest: ApprovalRequest;
  onApprove: () => void;
  onReject: () => void;
  onDismiss: () => void;
  /** See ApprovalBoundaryPanel's isLive doc — controls the brief's disclaimer wording. */
  isLive?: boolean;
}): React.ReactElement | null {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onDismiss}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-amber-800 bg-slate-950 p-5 shadow-2xl shadow-black/50"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide text-amber-300 uppercase">Human must authorize</h3>
          <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300" aria-label="Dismiss">
            ✕
          </button>
        </div>

        <div className="mb-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-sky-400 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> Agent recommends
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{approvalRequest.brief}</p>
          <p className="mt-2 text-[11px] text-slate-600">
            {isLive
              ? "Decision brief — evidence drawn from this run's live case, plan, and validator output (deterministic demo run); the approval decision is yours to make."
              : "Decision brief — static demo content, not a live model output."}
          </p>
        </div>

        <div className="mb-3 flex items-center gap-2 pl-1 text-slate-700" aria-hidden>
          <span className="font-mono text-sm leading-none">&darr;</span>
          <span className="text-[10px] tracking-wide uppercase">cannot proceed without</span>
        </div>

        <div className="flex items-center gap-2">
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
