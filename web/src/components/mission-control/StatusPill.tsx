import type { CaseStatus } from "@nexus/shared/types/case";

export type PillTone = "success" | "warning" | "danger" | "info" | "neutral" | "pending";

const TONE_CLASSES: Record<PillTone, string> = {
  success: "bg-emerald-950 text-emerald-300 border-emerald-800",
  warning: "bg-amber-950 text-amber-300 border-amber-800",
  danger: "bg-red-950 text-red-300 border-red-800",
  info: "bg-sky-950 text-sky-300 border-sky-800",
  neutral: "bg-slate-800 text-slate-300 border-slate-700",
  pending: "bg-violet-950 text-violet-300 border-violet-800"
};

const DOT_CLASSES: Record<PillTone, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-sky-400",
  neutral: "bg-slate-400",
  pending: "bg-violet-400"
};

export function StatusPill({ label, tone, dot = false }: { label: string; tone: PillTone; dot?: boolean }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide ${TONE_CLASSES[tone]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASSES[tone]}`} />}
      {label}
    </span>
  );
}

/** PRD §24 — maps every Case.status value to a display tone. */
export function caseStatusTone(status: CaseStatus): PillTone {
  switch (status) {
    case "GOAL_ACHIEVED":
      return "success";
    case "NO_FEASIBLE_RECOVERY":
      return "danger";
    case "HUMAN_ESCALATED_AWAITING_DECISION":
      return "pending";
    case "QUEUED":
      return "neutral";
    case "ADAPT_REPLAN":
      return "warning";
    default:
      return "info";
  }
}

/** PRD §14 — the three tool-call outcomes. Never treat FAILURE/NO_DATA as success (§15). */
export function toolResultTone(status: "SUCCESS" | "FAILURE" | "NO_DATA"): PillTone {
  if (status === "SUCCESS") return "success";
  if (status === "FAILURE") return "danger";
  return "warning";
}

export function approvalStatusTone(status: "PENDING" | "APPROVED" | "REJECTED"): PillTone {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return "pending";
}

export function auditActorTone(actor: "AGENT" | "HUMAN" | "SYSTEM"): PillTone {
  if (actor === "HUMAN") return "pending";
  if (actor === "SYSTEM") return "neutral";
  return "info";
}
