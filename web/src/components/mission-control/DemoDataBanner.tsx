export function DemoDataBanner({ live = false }: { live?: boolean }): React.ReactElement {
  return (
    <div className="border-b border-amber-900 bg-amber-950/60 px-6 py-1.5 text-center text-xs font-medium tracking-wide text-amber-300">
      {live ? (
        <>
          LIVE AGENT RUN — this incident is being processed by the real deterministic agent (in-memory store, local
          stand-in for Claude). No randomness: identical fixture in, identical sequence out.
        </>
      ) : (
        <>
          DEMO DATA — this screen is a presentation-only fixture. Numbers are computed by the real deterministic
          formulas/validator; trigger &quot;Shipment Delayed 24h&quot; below to run the live agent instead.
        </>
      )}
    </div>
  );
}
