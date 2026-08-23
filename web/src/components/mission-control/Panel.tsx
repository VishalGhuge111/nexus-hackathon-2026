import type { PropsWithChildren, ReactNode } from "react";

export type PanelTone = "neutral" | "primary" | "warning" | "danger" | "success";

const TONE_CLASSES: Record<PanelTone, { border: string; headerBg: string }> = {
  neutral: { border: "border-zinc-200/80", headerBg: "bg-zinc-50/70" },
  primary: { border: "border-blue-200/70", headerBg: "bg-blue-50/40" },
  warning: { border: "border-amber-200/80", headerBg: "bg-amber-50/40" },
  danger: { border: "border-red-200/80", headerBg: "bg-red-50/40" },
  success: { border: "border-emerald-200/80", headerBg: "bg-emerald-50/40" }
};

export function Panel({
  title,
  subtitle,
  tone = "neutral",
  headerRight,
  className = "",
  children
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  tone?: PanelTone;
  headerRight?: ReactNode;
  className?: string;
}>): React.ReactElement {
  const toneStyle = TONE_CLASSES[tone] ?? TONE_CLASSES.neutral;
  return (
    <section className={`rounded-xl border ${toneStyle.border} bg-white shadow-2xs overflow-hidden transition-all select-none ${className}`}>
      <header className={`flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5 ${toneStyle.headerBg}`}>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-zinc-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-zinc-500 font-medium mt-0.5 truncate">{subtitle}</p>}
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}