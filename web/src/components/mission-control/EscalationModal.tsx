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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4" onClick={onDismiss}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-amber-200 bg-white p-5 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide text-amber-700 uppercase">Human must authorize</h3>
          <button onClick={onDismiss} className="cursor-pointer text-zinc-400 hover:text-zinc-700" aria-label="Dismiss">
            ✕
          </button>
        </div>

        <div className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-sky-600 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> NEXUS recommends
          </div>
          <p className="text-sm leading-relaxed text-zinc-700">{approvalRequest.brief}</p>
          <p className="mt-2 text-[11px] text-zinc-400">
            Decision brief — evidence drawn from this run&apos;s live case, plan, and validator output; the approval decision is yours to make.
          </p>
        </div>

        <div className="mb-3 flex items-center gap-2 pl-1 text-zinc-300" aria-hidden>
          <span className="font-mono text-sm leading-none">&darr;</span>
          <span className="text-[10px] tracking-wide uppercase">cannot proceed without</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onReject();
              onDismiss();
            }}
            className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50"
          >
            Reject
          </button>
          <button
            onClick={() => {
              onApprove();
              onDismiss();
            }}
            className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Approve Recovery
          </button>
          <button onClick={onDismiss} className="ml-auto cursor-pointer rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-700">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
