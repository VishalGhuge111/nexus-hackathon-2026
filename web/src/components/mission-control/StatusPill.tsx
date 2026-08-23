export type PillTone = "neutral" | "info" | "warning" | "danger" | "success" | "pending";

const TONE_CLASSES: Record<PillTone, { bg: string; text: string; border: string; dot: string }> = {
  neutral: { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-200", dot: "bg-zinc-400" },
  info: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  warning: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500" },
  danger: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  success: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" },
  pending: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" }
};

export function StatusPill({
  label,
  tone = "neutral",
  dot = false,
  className = ""
}: {
  label: string;
  tone?: PillTone;
  dot?: boolean;
  className?: string;
}): React.ReactElement {
  const toneStyle = TONE_CLASSES[tone] ?? TONE_CLASSES.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider ${toneStyle.bg} ${toneStyle.text} ${toneStyle.border} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${toneStyle.dot}`} />}
      {label}
    </span>
  );
}

export function caseStatusTone(status: string): PillTone {
  if (status === "GOAL_ACHIEVED") return "success";
  if (status === "NO_FEASIBLE_RECOVERY") return "danger";
  if (status === "HUMAN_ESCALATED_AWAITING_DECISION") return "pending";
  if (status === "ADAPT_REPLAN" || status === "EARLY_RISK_CHECK" || status === "EXECUTE_OR_ESCALATE") return "warning";
  return "info";
}

export function toolStatusTone(status: "SUCCESS" | "FAILURE" | "NO_DATA"): PillTone {
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