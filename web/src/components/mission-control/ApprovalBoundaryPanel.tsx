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
  disabled = false,
  isLive = false
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
  /**
   * True once a real live case is loaded (as opposed to the static demo
   * fixture). Controls the brief's disclaimer wording below — the live brief
   * is genuinely built from this run's case/plan/validator state, so it must
   * not carry the static-fixture "not a live model output" caveat.
   */
  isLive?: boolean;
}): React.ReactElement {
  return (
    <Panel
      title="Human Approval Boundary"
      subtitle="Only entry/exit point requiring a human ApprovalRequest decision (§21)"
      tone="primary"
      className={decision === "PENDING" ? "border-amber-900/60" : ""}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-slate-500">Request {approvalRequest.id}</span>
        <StatusPill label={decision} tone={approvalStatusTone(decision)} />
      </div>

      {/* Full panel width (it now spans the page, not a narrow column) lets the
          agent's recommendation and the human's authorization sit side by side
          on wider screens — the handoff between them is the whole point of this
          section, so it should read as two halves of one gate, not a scroll. */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch md:gap-4">
        {/* Zone 1 — what the agent can do on its own: recommend. */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
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

        {/* Divider makes the authority handoff explicit: the agent's recommendation
            cannot execute anything by itself — only the zone on the other side can. */}
        <div className="flex flex-row items-center justify-center gap-2 text-slate-700 md:w-20 md:flex-col md:gap-1.5" aria-hidden>
          <span className="font-mono text-sm leading-none md:hidden">&darr;</span>
          <span className="hidden font-mono text-lg leading-none md:inline">&rarr;</span>
          <span className="text-center text-[10px] leading-tight tracking-wide uppercase">cannot proceed without</span>
        </div>

        {/* Zone 2 — the one action only a human can take. */}
        <div
          className={`rounded-lg border p-4 ${decision === "PENDING" ? "border-amber-700/70 bg-amber-950/20" : "border-slate-800 bg-slate-900/20"}`}
        >
          <div
            className={`mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase ${decision === "PENDING" ? "text-amber-300" : "text-slate-500"}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${decision === "PENDING" ? "bg-amber-400" : "bg-slate-600"}`} /> Human must authorize
          </div>

          {decision === "PENDING" && onOpenModal && (
            <button
              onClick={onOpenModal}
              disabled={disabled}
              className="mb-3 flex w-full items-center justify-between rounded border border-amber-700 bg-amber-900/30 px-3 py-2.5 text-left hover:bg-amber-900/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-amber-900/30"
            >
              <span className="text-xs font-semibold tracking-wide text-amber-300 uppercase">Human action required</span>
              <span className="rounded bg-amber-600 px-2.5 py-1 text-xs font-semibold text-amber-950">Review Approval</span>
            </button>
          )}
          {disabled && (
            <p className="mb-3 text-[11px] text-sky-400">Starting live run — controls re-enable once the live case loads.</p>
          )}

          {decision === "PENDING" ? (
            <div className="flex items-center gap-2">
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
              {!isLive && <span className="text-[11px] text-slate-600">demo shell — recorded locally, not persisted</span>}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Resolved locally in this demo shell as {decision}.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
