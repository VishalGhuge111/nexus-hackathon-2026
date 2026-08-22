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
      className={`rounded-lg border ${
        isPrimary ? "border-slate-700 bg-slate-900/60 shadow-lg shadow-black/20" : "border-slate-800/70 bg-slate-900/25"
      } ${className}`}
    >
      <header
        className={`flex items-start justify-between gap-3 border-b px-5 py-3.5 ${isPrimary ? "border-slate-700" : "border-slate-800/70"}`}
      >
        <div>
          <h2
            className={`font-semibold ${
              isPrimary ? "text-[13px] tracking-wide text-slate-100 uppercase" : "text-sm tracking-wide text-slate-300"
            }`}
          >
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-[11px] leading-snug text-slate-600">{subtitle}</p>}
        </div>
        {headerRight}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
