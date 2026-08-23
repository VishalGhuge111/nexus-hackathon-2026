import type { SupplierMessage } from "@nexus/shared/types/supplier";
import { Panel } from "./Panel";
import { StatusPill, type PillTone } from "./StatusPill";

function emailStatusTone(status: string): PillTone {
  if (status === "SENT") return "success";
  if (status === "FAILED") return "danger";
  return "warning"; // NOT_CONFIGURED
}

function emailStatusLabel(status: string): string {
  if (status === "SENT") return "SENT";
  if (status === "FAILED") return "FAILED";
  return "RECORDED ONLY";
}

// Deterministic UTC time-of-day slice — matches AuditTimeline's own formatting
// so this never risks a locale/timezone SSR/CSR hydration mismatch.
function formatTime(iso: string): string {
  return `${iso.replace("T", " ").slice(11, 19)} UTC`;
}

/**
 * PS §5.5/5.6 — the operator-visible supplier communication thread: real
 * outbound RFQ emails (shared/tools/primitives.ts supplierMessageSendTool,
 * sent via shared/email/brevoClient.ts) and the supplier's quote reply,
 * represented as an inbound message but sourced verbatim from the RFQ engine's
 * own RfqResponse (see buildQuoteInboundMessage) — nothing here is invented.
 */
export function SupplierCommunicationPanel({
  messages,
  supplierNames
}: {
  messages: SupplierMessage[];
  supplierNames: Record<string, string>;
}): React.ReactElement | null {
  if (messages.length === 0) return null;

  const sorted = [...messages].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

  return (
    <Panel
      title="Supplier Communication"
      subtitle="Outbound RFQ emails and the resulting supplier quotes"
      tone="neutral"
    >
      <ul className="space-y-2.5">
        {sorted.map((msg) => {
          const name = supplierNames[msg.supplierId] ?? msg.supplierId;
          const fields = msg.extractedFields as Record<string, unknown> | undefined;

          if (msg.direction === "OUTBOUND") {
            const emailStatus = (fields?.emailStatus as string) ?? "NOT_CONFIGURED";
            const to = fields?.to as string | undefined;
            const overrideUsed = Boolean(fields?.overrideUsed);
            const intendedRecipient = fields?.intendedRecipient as string | undefined;
            return (
              <li key={msg.id} className="rounded-xl border border-zinc-200/80 bg-white p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-zinc-900">NEXUS → {name}</span>
                  <StatusPill label={emailStatusLabel(emailStatus)} tone={emailStatusTone(emailStatus)} />
                </div>
                <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                  {to ? `To: ${to}` : "No contact email on file"} · {formatTime(msg.sentAt)}
                </div>
                {overrideUsed && (
                  <div className="mt-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 inline-block">
                    Recipient overridden for demo verification — supplier's real address on file: {intendedRecipient ?? "none"}
                  </div>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] font-semibold text-blue-700 select-none">
                    {msg.subject} — view message
                  </summary>
                  <p className="mt-1.5 whitespace-pre-wrap text-[11px] text-zinc-600 bg-zinc-50/80 p-2 rounded-lg border border-zinc-100">
                    {msg.body}
                  </p>
                </details>
                {emailStatus === "FAILED" && fields?.emailError ? (
                  <p className="mt-1.5 text-[11px] text-red-600">{String(fields.emailError)}</p>
                ) : null}
              </li>
            );
          }

          // INBOUND — a contradiction reply pairs the supplier's claim against
          // independent tracking evidence (PS §5.5); otherwise this is a quote
          // reply derived from RfqResponse fields.
          if (msg.contradictionFlag) {
            const claimedStatus = fields?.claimedStatus as string | undefined;
            const trackingStatus = fields?.trackingStatus as string | undefined;
            return (
              <li key={msg.id} className="rounded-xl border border-red-200 bg-red-50/30 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-zinc-900">{name} → NEXUS</span>
                  <StatusPill label="CONTRADICTION" tone="danger" />
                </div>
                <div className="mt-1 text-[11px] text-zinc-500 font-mono">{formatTime(msg.sentAt)}</div>
                <div className="mt-2 space-y-1.5 text-[11px]">
                  <div className="bg-white/70 p-2 rounded-lg border border-red-100">
                    <span className="font-bold uppercase tracking-wider text-red-700 text-[10px]">Supplier claim:</span>{" "}
                    <span className="text-zinc-700">{claimedStatus ?? msg.body}</span>
                  </div>
                  {trackingStatus && (
                    <div className="bg-white/70 p-2 rounded-lg border border-zinc-200">
                      <span className="font-bold uppercase tracking-wider text-zinc-500 text-[10px]">Verification (tracking):</span>{" "}
                      <span className="text-zinc-700">{trackingStatus}</span>
                    </div>
                  )}
                </div>
              </li>
            );
          }

          const price = fields?.price as number | undefined;
          const leadTimeDays = fields?.leadTimeDays as number | undefined;
          const capacityOffered = fields?.capacityOffered as number | undefined;
          const expediteFee = fields?.expediteFee as number | undefined;
          return (
            <li key={msg.id} className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-zinc-900">{name} → NEXUS</span>
                <StatusPill label="QUOTE RECEIVED" tone="success" />
              </div>
              <div className="mt-1 text-[11px] text-zinc-500 font-mono">{formatTime(msg.sentAt)}</div>
              {price !== undefined ? (
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono bg-white/70 p-2 rounded-lg border border-emerald-100">
                  <div>
                    <span className="text-zinc-400">Price:</span> <strong className="text-zinc-800">₹{price}/unit</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">Lead time:</span> <strong className="text-zinc-800">{leadTimeDays}d</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400">Capacity:</span> <strong className="text-zinc-800">{capacityOffered}u</strong>
                  </div>
                  {expediteFee !== undefined && (
                    <div>
                      <span className="text-zinc-400">Expedite:</span> <strong className="text-zinc-800">+₹{expediteFee}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-1.5 text-[11px] text-zinc-600">{msg.body}</p>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
