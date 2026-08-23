import type { Supplier } from "@nexus/shared/types/supplier";
import type { PurchaseOrder, RfqResponse } from "@nexus/shared/types/procurement";
import type { EligibilityResult } from "@nexus/shared/supplier";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";
import { Building2, Package, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

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

  const recommendedId = eligibleCandidates.length
    ? eligibleCandidates.reduce((best, candidate) => {
        const candidatePrice =
          rfqResponses[candidate.supplier.id]?.price ?? Object.values(candidate.supplier.pricePerUnit)[0] ?? Infinity;
        const bestPrice =
          rfqResponses[best.supplier.id]?.price ?? Object.values(best.supplier.pricePerUnit)[0] ?? Infinity;
        if (candidatePrice !== bestPrice) return candidatePrice < bestPrice ? candidate : best;
        const candidateScore = candidate.supplier.reliabilityScore + candidate.supplier.qualityScore;
        const bestScore = best.supplier.reliabilityScore + best.supplier.qualityScore;
        return candidateScore > bestScore ? candidate : best;
      }).supplier.id
    : null;

  return (
    <Panel
      title="Supplier Qualification & RFQ Quotes"
      subtitle="Autonomous eligibility filtering and dynamic quotation evaluation"
      tone="neutral"
    >
      <ul className="space-y-2.5">
        {supplierEligibility.map(({ supplier, result }) => {
          const isDisrupted = supplier.id === disruptedSupplierId;
          const isRecommended = supplier.id === recommendedId;
          const quote = rfqResponses[supplier.id];

          return (
            <li
              key={supplier.id}
              className={`rounded-xl border p-3 text-xs transition-all ${
                isRecommended
                  ? "border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-300/40"
                  : isDisrupted
                  ? "border-red-200 bg-red-50/20"
                  : "border-zinc-200/80 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900 font-mono">{supplier.name}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">({supplier.id})</span>
                  {isRecommended && <StatusPill label="RECOMMENDED" tone="success" />}
                </div>

                {isDisrupted ? (
                  <StatusPill label="DISRUPTED SOURCE" tone="danger" />
                ) : (
                  <StatusPill
                    label={result.eligible ? "ELIGIBLE" : "INELIGIBLE"}
                    tone={result.eligible ? "success" : "danger"}
                  />
                )}
              </div>

              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-500 font-mono bg-zinc-50/80 p-2 rounded-lg border border-zinc-100">
                <div>
                  <span className="text-zinc-400">Reliability:</span>{" "}
                  <strong className="text-zinc-800">{(supplier.reliabilityScore * 100).toFixed(0)}%</strong>
                </div>
                <div>
                  <span className="text-zinc-400">Quality:</span>{" "}
                  <strong className="text-zinc-800">{(supplier.qualityScore * 100).toFixed(0)}%</strong>
                </div>
                <div>
                  <span className="text-zinc-400">MOQ:</span>{" "}
                  <strong className="text-zinc-800">{supplier.moq}u</strong>
                </div>
                <div>
                  <span className="text-zinc-400">Lead Time:</span>{" "}
                  <strong className="text-zinc-800">{supplier.defaultLeadTimeDays}d</strong>
                </div>
              </div>

              {quote && (
                <div className="mt-2 font-mono text-[11px] text-blue-700 bg-blue-50/70 px-2.5 py-1.5 rounded-md border border-blue-100 flex items-center justify-between flex-wrap gap-2">
                  <span>
                    RFQ Quote: <strong>₹{quote.price.toLocaleString('en-IN')}/unit</strong> · {quote.capacityOffered} units offered
                  </span>
                  <span>
                    ETA: {quote.leadTimeDays}d {quote.expediteAvailable ? `(Expedite: +₹${quote.expediteFee})` : ''}
                  </span>
                </div>
              )}

              {!isDisrupted && !result.eligible && (
                <div className="mt-2 text-[11px] text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                  <div className="font-bold text-[10px] uppercase tracking-wider mb-0.5">Disqualification Reasons:</div>
                  <ul className="list-inside list-disc space-y-0.5">
                    {result.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Active Purchase Orders Section */}
      <div className="mt-4 border-t border-zinc-100 pt-3">
        <div className="mb-2 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
          Related Purchase Orders
        </div>
        <ul className="space-y-1.5">
          {purchaseOrders.map((po) => (
            <li
              key={po.id}
              className="flex items-center justify-between text-xs bg-zinc-50/70 px-3 py-2 rounded-lg border border-zinc-100"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-zinc-800">{po.id}</span>
                <span className="text-zinc-500 font-mono text-[11px]">
                  · {po.qty} units from {po.supplierId}
                </span>
              </div>
              <StatusPill label={po.status} tone={po.status === "DELAYED" ? "danger" : "info"} />
            </li>
          ))}
          {purchaseOrders.length === 0 && (
            <li className="text-zinc-400 text-xs py-2 text-center">No existing purchase orders linked.</li>
          )}
        </ul>
      </div>
    </Panel>
  );
}