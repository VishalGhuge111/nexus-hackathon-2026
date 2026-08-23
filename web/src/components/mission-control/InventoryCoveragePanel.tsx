import type { InventoryRecord } from "@nexus/shared/types/inventory";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";
import { AlertTriangle } from "lucide-react";

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
    <Panel
      title="Inventory Ground Truth & Safety Coverage"
      subtitle={`Component SKU ${inventory.sku} · Warehouse Node ${inventory.warehouseId}`}
      tone="neutral"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <Field label="usableStock (Ground Truth)" value={String(inventory.usableStock)} highlight />
        <Field label="currentStock (ERP System)" value={String(inventory.currentStock)} />
        <Field label="Daily Consumption Rate" value={`${inventory.dailyUsageRate} units/day`} />
        <Field label="Safety Stock Threshold" value={`${inventory.safetyStockThreshold} units`} />
        <Field label="Coverage Buffer Days" value={`${coverageDays.toFixed(2)} days`} highlight />
        <Field
          label="Safety Stock Ratio"
          value={safetyStockRatio === null ? "Disabled" : safetyStockRatio.toFixed(2)}
        />
      </div>

      {inventory.stockDiscrepancyFlag && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">ERP Telemetry Discrepancy Detected:</strong>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              ERP records report <span className="font-mono font-bold">{inventory.currentStock}</span> units, while physical warehouse scan confirms <span className="font-mono font-bold">{inventory.usableStock}</span> usable units. NEXUS decision engine enforces physical ground truth for all continuity planning.
            </p>
          </div>
        </div>
      )}
    </Panel>
  );
}

function Field({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: string;
  highlight?: boolean;
}): React.ReactElement {
  return (
    <div className="bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-100">
      <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 truncate">{label}</div>
      <div className={`font-mono text-sm mt-0.5 ${highlight ? "font-bold text-blue-700" : "font-semibold text-zinc-800"}`}>
        {value}
      </div>
    </div>
  );
}