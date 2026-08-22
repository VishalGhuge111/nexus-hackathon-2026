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
    <section className={`rounded-xl border border-zinc-200 bg-white shadow-sm ${className}`}>
      <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
        <div>
          <h2
            className={`font-bold ${
              isPrimary ? "text-[11px] tracking-[0.15em] text-zinc-900 uppercase" : "text-sm tracking-wide text-zinc-600"
            }`}
          >
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-[11px] leading-snug text-zinc-400">{subtitle}</p>}
        </div>
        {headerRight}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
