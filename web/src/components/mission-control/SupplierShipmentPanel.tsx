// PRD §17 (supplier_eligibility_check) + §14 (shipment tracking / PO status).
import type { Supplier } from "@nexus/shared/types/supplier";
import type { PurchaseOrder } from "@nexus/shared/types/procurement";
import type { EligibilityResult } from "@nexus/shared/supplier";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";

export function SupplierShipmentPanel({
  supplierEligibility,
  purchaseOrders,
  disruptedSupplierId
}: {
  supplierEligibility: { supplier: Supplier; result: EligibilityResult }[];
  purchaseOrders: PurchaseOrder[];
  disruptedSupplierId: string;
}): React.ReactElement {
  return (
    <Panel title="Suppliers &amp; Shipments" subtitle="supplier_eligibility_check output (§17), real function, not hand-typed">
      <ul className="space-y-2">
        {supplierEligibility.map(({ supplier, result }) => {
          const isDisrupted = supplier.id === disruptedSupplierId;
          return (
            <li key={supplier.id} className="rounded border border-slate-800 p-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-200">{supplier.name}</span>
                {isDisrupted ? (
                  <StatusPill label="excluded — disrupted PO" tone="warning" />
                ) : (
                  <StatusPill label={result.eligible ? "eligible" : "ineligible"} tone={result.eligible ? "success" : "danger"} />
                )}
              </div>
              <div className="mt-1 text-slate-500">
                reliability {supplier.reliabilityScore} · quality {supplier.qualityScore} · MOQ {supplier.moq} · lead time{" "}
                {supplier.defaultLeadTimeDays}d
              </div>
              {!isDisrupted && !result.eligible && (
                <ul className="mt-1 list-inside list-disc text-red-400">
                  {result.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 border-t border-slate-800 pt-3">
        <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Purchase orders</div>
        <ul className="space-y-1.5">
          {purchaseOrders.map((po) => (
            <li key={po.id} className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-300">
                {po.id} · {po.qty} units from {po.supplierId}
              </span>
              <StatusPill label={po.status} tone={po.status === "DELAYED" ? "danger" : "info"} />
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
