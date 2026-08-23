import type { RecoveryPlanVersion } from "@nexus/shared/types/procurement";
import type { ValidationResult } from "@nexus/shared/types/validation";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";
import { ValidatorChecklist } from "./ValidatorChecklist";
import { DoNothingVsNexus, type ScenarioResult } from "./DoNothingVsNexus";
import { formatDateUTC, formatINR } from "@/lib/missionControl/format";
import { PackageCheck, Calendar, DollarSign, ArrowRight } from "lucide-react";

export function RecoveryPlanPanel({
  activePlanVersion,
  validationResult,
  comparison
}: {
  activePlanVersion: RecoveryPlanVersion;
  validationResult: ValidationResult;
  comparison: { doNothing: ScenarioResult; nexusPlan: ScenarioResult };
}): React.ReactElement {
  const { plan } = activePlanVersion;
  return (
    <Panel
      title="Proposed Autonomous Recovery Plan"
      subtitle={`Synthesized plan configuration (Version v${activePlanVersion.version})`}
      tone="primary"
      headerRight={
        <StatusPill
          label={`PLAN V${activePlanVersion.version} · ${validationResult.overallPassed ? "VALIDATED" : "REJECTED"}`}
          tone={validationResult.overallPassed ? "success" : "danger"}
        />
      }
    >
      {/* Allocation Cards */}
      <div className="mb-4">
        <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-2">
          Supplier Purchase Allocations
        </div>
        <ul className="space-y-2">
          {plan.allocations.map((a, i) => (
            <li
              key={i}
              className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  #{i + 1}
                </div>
                <div>
                  <div className="font-bold text-zinc-900">
                    {a.qty} units from <span className="font-mono text-blue-700 font-semibold">{a.supplierId}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Unit Price: ₹{a.unitPrice.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-zinc-900">
                ₹{(a.qty * a.unitPrice).toLocaleString('en-IN')}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Financial & Delivery Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-xl bg-blue-50/40 border border-blue-100 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-700/80 tracking-wider">Total Recovery Cost</span>
          <p className="font-mono font-bold text-base text-zinc-900 mt-0.5">{formatINR(plan.totalCost)}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-700/80 tracking-wider">Expected Delivery ETA</span>
          <p className="font-mono font-semibold text-xs text-zinc-800 mt-0.5">
            {formatDateUTC(plan.expectedDeliveryDate)} UTC
          </p>
        </div>
      </div>

      {/* 8-Point Constraint Validation Checklist */}
      <div className="mb-5 border-t border-zinc-100 pt-4">
        <ValidatorChecklist result={validationResult} />
      </div>

      {/* Do-Nothing vs NEXUS Plan Impact Comparison */}
      <div className="border-t border-zinc-100 pt-4">
        <DoNothingVsNexus doNothing={comparison.doNothing} nexusPlan={comparison.nexusPlan} />
      </div>
    </Panel>
  );
}