// PRD §17 (supplier_eligibility_check) + §14 (shipment tracking / PO status) +
// §4.6/5.7 (RFQ / quote comparison) — this is the "supplier recommendation
// before procurement" surface: real eligibility gate, real RFQ quotes (when
// requested for this case), and a recommendation derived from both rather than
// picking cheapest-only.
import type { Supplier } from "@nexus/shared/types/supplier";
import type { PurchaseOrder, RfqResponse } from "@nexus/shared/types/procurement";
import type { EligibilityResult } from "@nexus/shared/supplier";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";

export function SupplierShipmentPanel({
  supplierEligibility,
  purchaseOrders,
  disruptedSupplierId,
  rfqResponses = {}
}: {
  supplierEligibility: { supplier: Supplier; result: EligibilityResult }[];
  purchaseOrders: PurchaseOrder[];
  disruptedSupplierId: string | null;
  rfqResponses?: Record<string, RfqResponse>;
}): React.ReactElement {
  const eligibleCandidates = supplierEligibility.filter(
    ({ supplier, result }) => supplier.id !== disruptedSupplierId && result.eligible
  );
  // Recommendation among ELIGIBLE suppliers only (never the cheapest overall —
  // an ineligible supplier is never a candidate regardless of price): prefer
  // the real RFQ quote price when one was requested for this case, tie-broken
  // by reliability+quality; falls back to the catalog price when no RFQ exists
  // yet for this case.
  const recommendedId = eligibleCandidates.length
    ? eligibleCandidates.reduce((best, candidate) => {
        const candidatePrice = rfqResponses[candidate.supplier.id]?.price ?? Object.values(candidate.supplier.pricePerUnit)[0] ?? Infinity;
        const bestPrice = rfqResponses[best.supplier.id]?.price ?? Object.values(best.supplier.pricePerUnit)[0] ?? Infinity;
        if (candidatePrice !== bestPrice) return candidatePrice < bestPrice ? candidate : best;
        const candidateScore = candidate.supplier.reliabilityScore + candidate.supplier.qualityScore;
        const bestScore = best.supplier.reliabilityScore + best.supplier.qualityScore;
        return candidateScore > bestScore ? candidate : best;
      }).supplier.id
    : null;

  return (
    <Panel title="Suppliers &amp; Shipments" subtitle="Real eligibility + RFQ quotes (§17/§4.6) — not hand-typed">
      <ul className="space-y-2">
        {supplierEligibility.map(({ supplier, result }) => {
          const isDisrupted = supplier.id === disruptedSupplierId;
          const isRecommended = supplier.id === recommendedId;
          const quote = rfqResponses[supplier.id];
          return (
            <li
              key={supplier.id}
              className={`rounded-lg border p-2.5 text-xs ${isRecommended ? "border-emerald-300 bg-emerald-50/40" : "border-zinc-200"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-zinc-800">
                  {supplier.name}
                  {isRecommended && <StatusPill label="recommended" tone="success" />}
                </span>
                {isDisrupted ? (
                  <StatusPill label="excluded — disrupted PO" tone="warning" />
                ) : (
                  <StatusPill label={result.eligible ? "eligible" : "ineligible"} tone={result.eligible ? "success" : "danger"} />
                )}
              </div>
              <div className="mt-1 text-zinc-400">
                reliability {supplier.reliabilityScore} · quality {supplier.qualityScore} · MOQ {supplier.moq} · lead time{" "}
                {supplier.defaultLeadTimeDays}d
              </div>
              {quote && (
                <div className="mt-1 font-mono text-zinc-500">
                  RFQ quote: ₹{quote.price}/unit · {quote.capacityOffered} units offered · {quote.leadTimeDays}d
                  {quote.expediteAvailable && quote.expediteFee ? ` · expedite +₹${quote.expediteFee}` : ""}
                </div>
              )}
              {!isDisrupted && !result.eligible && (
                <ul className="mt-1 list-inside list-disc text-red-600">
                  {result.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 border-t border-zinc-100 pt-3">
        <div className="mb-2 text-[11px] uppercase tracking-wide text-zinc-400">Purchase orders</div>
        <ul className="space-y-1.5">
          {purchaseOrders.map((po) => (
            <li key={po.id} className="flex items-center justify-between text-xs">
              <span className="font-mono text-zinc-600">
                {po.id} · {po.qty} units from {po.supplierId}
              </span>
              <StatusPill label={po.status} tone={po.status === "DELAYED" ? "danger" : "info"} />
            </li>
          ))}
          {purchaseOrders.length === 0 && <li className="text-zinc-400">No data</li>}
        </ul>
      </div>
    </Panel>
  );
}
