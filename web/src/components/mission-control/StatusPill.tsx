import type { CaseStatus } from "@nexus/shared/types/case";

export type PillTone = "success" | "warning" | "danger" | "info" | "neutral" | "pending";

const TONE_CLASSES: Record<PillTone, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
  neutral: "bg-zinc-100 text-zinc-600 border-zinc-200",
  pending: "bg-violet-50 text-violet-700 border-violet-200"
};

const DOT_CLASSES: Record<PillTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
  neutral: "bg-zinc-400",
  pending: "bg-violet-500"
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
