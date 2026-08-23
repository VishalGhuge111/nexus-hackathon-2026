"use client";

import type { ApprovalRequest } from "@nexus/shared/types/validation";
import { ShieldAlert, CheckCircle2, X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 p-4 backdrop-blur-xs animate-fade-in select-none">
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                Governance Sign-Off Required
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Authorization Boundary Escalation
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="cursor-pointer p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-4 text-xs text-amber-950 space-y-2">
          <p className="font-semibold leading-relaxed">{approvalRequest.brief}</p>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/80 font-mono text-[11px]">
            <div>
              <span className="text-amber-700">Request ID:</span>{" "}
              <strong>{approvalRequest.id}</strong>
            </div>
            <div>
              <span className="text-amber-700">Governance Threshold:</span> <strong>₹10,000</strong>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Authorizing this recovery plan will instruct the agent to dispatch expedited Purchase Orders to the qualified candidate supplier(s) and update manufacturing delivery schedules.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
          <button
            onClick={() => {
              onReject();
              onDismiss();
            }}
            className="cursor-pointer px-4 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Reject Plan
          </button>
          <button
            onClick={() => {
              onApprove();
              onDismiss();
            }}
            className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-2xs hover:bg-emerald-700 transition-colors"
          >
            <CheckCircle2 size={14} />
            <span>Approve &amp; Dispatch</span>
          </button>
        </div>
      </div>
    </div>
  );
}