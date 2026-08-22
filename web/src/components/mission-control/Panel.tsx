import type { ReactNode } from "react";

// "primary" marks the panels that carry the demo's story (active incident,
// agent state, recovery plan, approval boundary); "secondary" (default) is
// for supporting evidence — quieter heading, tighter type, softer border.
export type PanelTone = "primary" | "secondary";

export function Panel({
  title,
  subtitle,
  headerRight,
  children,
  className = "",
  tone = "secondary"
}: {
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: PanelTone;
}): React.ReactElement {
  const isPrimary = tone === "primary";
  return (
    <section
      className={`rounded border ${isPrimary ? "border-slate-700 bg-slate-900/60" : "border-slate-800/70 bg-slate-900/25"} ${className}`}
    >
      <header className={`flex items-start justify-between gap-3 border-b ${isPrimary ? "border-slate-700" : "border-slate-800/70"} px-5 py-3`}>
        <div>
          <h2 className={`font-semibold tracking-wide ${isPrimary ? "text-base text-slate-100" : "text-sm text-slate-300"}`}>
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-slate-600">{subtitle}</p>}
        </div>
        {headerRight}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
