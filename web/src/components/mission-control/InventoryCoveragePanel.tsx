// PRD §19/§26 — usableStock (ground truth) vs currentStock (ERP, may be stale/
// wrong per PS Scenario 2). Coverage math ALWAYS uses usableStock, never currentStock.
import type { InventoryRecord } from "@nexus/shared/types/inventory";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";

export function InventoryCoveragePanel({
  inventory,
  coverageDays,
  safetyStockRatio,
  productionRequirement
}: {
  inventory: InventoryRecord;
  coverageDays: number;
  safetyStockRatio: number | null;
  productionRequirement: number;
}): React.ReactElement {
  return (
    <Panel title="Inventory &amp; Coverage" subtitle={`SKU ${inventory.sku} · Warehouse ${inventory.warehouseId}`}>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="usableStock (ground truth)" value={String(inventory.usableStock)} highlight />
        <Field label="currentStock (ERP, may be stale)" value={String(inventory.currentStock)} />
        <Field label="Daily usage rate" value={`${inventory.dailyUsageRate}/day`} />
        <Field label="Safety stock threshold" value={String(inventory.safetyStockThreshold)} />
        <Field label="coverage_days" value={`${coverageDays.toFixed(2)}d`} />
        <Field label="safety_stock_ratio" value={safetyStockRatio === null ? "disabled" : safetyStockRatio.toFixed(2)} />
        <Field label="Production requirement" value={String(productionRequirement)} />
      </div>

      {inventory.stockDiscrepancyFlag && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <StatusPill label="discrepancy" tone="warning" />
          <span>
            currentStock ({inventory.currentStock}) ≠ usableStock ({inventory.usableStock}) — all math below uses
            usableStock (PS Scenario 2 / Hidden Test 2).
          </span>
        </div>
      )}
    </Panel>
  );
}

function Field({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }): React.ReactElement {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</div>
      <div className={`font-mono ${highlight ? "font-semibold text-zinc-900" : "text-zinc-600"}`}>{value}</div>
    </div>
  );
}
