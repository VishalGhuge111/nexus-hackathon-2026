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
   * but before the live case has loaded. Disables Review Approval / Approve /
   * Reject until that window closes, so a click can never act on stale content.
   */
  disabled?: boolean;
}): React.ReactElement {
  return (
    <Panel
      title="Human Approval Boundary"
      subtitle="Only entry/exit point requiring a human ApprovalRequest decision (§21)"
      tone="primary"
      className={decision === "PENDING" ? "border-amber-200 ring-1 ring-amber-100" : ""}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-zinc-400">Request {approvalRequest.id}</span>
        <StatusPill label={decision} tone={approvalStatusTone(decision)} />
      </div>

      {/* Full panel width (it now spans the page, not a narrow column) lets the
          agent's recommendation and the human's authorization sit side by side
          on wider screens — the handoff between them is the whole point of this
          section, so it should read as two halves of one gate, not a scroll. */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch md:gap-4">
        {/* Zone 1 — what the agent can do on its own: recommend. */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-sky-600 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> NEXUS recommends
          </div>
          <p className="text-sm leading-relaxed text-zinc-700">{approvalRequest.brief}</p>
          <p className="mt-2 text-[11px] text-zinc-400">
            Decision brief — evidence drawn from this run&apos;s live case, plan, and validator output; the approval decision is yours to make.
          </p>
        </div>

        {/* Divider makes the authority handoff explicit: the agent's recommendation
            cannot execute anything by itself — only the zone on the other side can. */}
        <div className="flex flex-row items-center justify-center gap-2 text-zinc-300 md:w-20 md:flex-col md:gap-1.5" aria-hidden>
          <span className="font-mono text-sm leading-none md:hidden">&darr;</span>
          <span className="hidden font-mono text-lg leading-none md:inline">&rarr;</span>
          <span className="text-center text-[10px] leading-tight tracking-wide uppercase">cannot proceed without</span>
        </div>

        {/* Zone 2 — the one action only a human can take. */}
        <div
          className={`rounded-lg border p-4 ${decision === "PENDING" ? "border-amber-300 bg-amber-50" : "border-zinc-200 bg-zinc-50"}`}
        >
          <div
            className={`mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase ${decision === "PENDING" ? "text-amber-700" : "text-zinc-400"}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${decision === "PENDING" ? "bg-amber-500" : "bg-zinc-300"}`} /> Human must authorize
          </div>

          {decision === "PENDING" && onOpenModal && (
            <button
              onClick={onOpenModal}
              disabled={disabled}
              className="mb-3 flex w-full cursor-pointer items-center justify-between rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-left shadow-sm hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
            >
              <span className="text-xs font-semibold tracking-wide text-amber-700 uppercase">Human action required</span>
              <span className="rounded bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">Review Approval</span>
            </button>
          )}
          {disabled && (
            <p className="mb-3 text-[11px] text-sky-600">Starting live run — controls re-enable once the live case loads.</p>
          )}

          {decision === "PENDING" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onReject}
                disabled={disabled}
                className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              >
                Reject
              </button>
              <button
                onClick={onApprove}
                disabled={disabled}
                className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-emerald-600"
              >
                Approve Recovery
              </button>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Resolved as {decision} — recorded in the case and audit trail.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
