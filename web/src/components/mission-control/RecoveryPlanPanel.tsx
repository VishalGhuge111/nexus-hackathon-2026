// PRD §28 — "Right panel — Plan & Validator: candidate RecoveryPlan(s), Validator
// checklist rendered as pass/fail rows with actual numbers, Do-Nothing vs NEXUS
// Plan comparison."
import type { RecoveryPlanVersion } from "@nexus/shared/types/procurement";
import type { ValidationResult } from "@nexus/shared/types/validation";
import { Panel } from "./Panel";
import { StatusPill } from "./StatusPill";
import { ValidatorChecklist } from "./ValidatorChecklist";
import { DoNothingVsNexus, type ScenarioResult } from "./DoNothingVsNexus";
import { formatDateUTC, formatINR } from "@/lib/missionControl/format";

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
      title="Recovery Plan"
      subtitle={`Active plan version v${activePlanVersion.version}`}
      tone="primary"
      className="border-sky-100"
      headerRight={
        <StatusPill
          label={`V${activePlanVersion.version} · ${validationResult.overallPassed ? "VALIDATED" : "REJECTED"}`}
          tone={validationResult.overallPassed ? "success" : "danger"}
        />
      }
    >
      <ul className="mb-2 space-y-1 text-sm">
        {plan.allocations.map((a, i) => (
          <li key={i} className="flex items-center justify-between">
            <span className="text-zinc-700">
              {a.qty} units from <span className="font-mono text-zinc-900">{a.supplierId}</span>
            </span>
            <span className="font-mono text-zinc-500">@ ₹{a.unitPrice}</span>
          </li>
        ))}
      </ul>
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-zinc-400">Total cost</span>
        <span className="font-mono font-semibold text-zinc-900">{formatINR(plan.totalCost)}</span>
      </div>
      <div className="mb-4 flex items-center justify-between text-xs text-zinc-400">
        <span>Expected delivery</span>
        <span className="font-mono">{formatDateUTC(plan.expectedDeliveryDate)} (UTC)</span>
      </div>

      <div className="mb-4 border-t border-zinc-100 pt-3">
        <ValidatorChecklist result={validationResult} />
      </div>

      <div className="border-t border-zinc-100 pt-3">
        <DoNothingVsNexus doNothing={comparison.doNothing} nexusPlan={comparison.nexusPlan} />
      </div>
    </Panel>
  );
}
