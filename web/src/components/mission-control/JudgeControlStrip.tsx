"use client";

// PRD §28/§31 — "Judge control strip (top-right, demo-only): three buttons —
// Supplier Capacity Drop 50%, Shipment Delayed 24h, Demand +30% — firing
// POST /api/agent/event." Only SHIPMENT_DELAY is wired to the real API route
// (see web/src/app/api/agent/event/route.ts) — the other two event types
// return 501 there, so they're left as an honest "not wired" note.

import { useState } from "react";

const EVENTS = [
  { id: "SUPPLIER_CAPACITY_DROP", label: "Supplier Capacity Drop 50%" },
  { id: "SHIPMENT_DELAY", label: "Shipment Delayed 24h" },
  { id: "DEMAND_SPIKE", label: "Demand +30%" }
] as const;

export function JudgeControlStrip({
  onTriggerShipmentDelay,
  disabled
}: {
  onTriggerShipmentDelay?: () => void;
  disabled?: boolean;
}): React.ReactElement {
  const [note, setNote] = useState<string | null>(null);

  function handleClick(eventId: (typeof EVENTS)[number]["id"], label: string): void {
    if (eventId === "SHIPMENT_DELAY" && onTriggerShipmentDelay) {
      setNote(null);
      onTriggerShipmentDelay();
      return;
    }
    setNote(`"${label}" is not wired to a live event in this build (API route returns 501 for this type).`);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-[10px] uppercase tracking-wide text-slate-600">Demo controls</span>
      <div className="flex flex-wrap justify-end gap-1.5">
        {EVENTS.map((event) => (
          <button
            key={event.id}
            disabled={disabled}
            onClick={() => handleClick(event.id, event.label)}
            className="rounded border border-slate-800 bg-slate-900/60 px-2 py-1 text-[11px] font-medium text-slate-400 hover:border-slate-600 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {event.label}
          </button>
        ))}
      </div>
      {note && <p className="text-[11px] text-slate-600">{note}</p>}
    </div>
  );
}
