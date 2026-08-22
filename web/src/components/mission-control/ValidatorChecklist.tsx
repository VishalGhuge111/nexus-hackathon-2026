// PRD §16 — "Output: ValidationResult listing every check with pass/fail and the
// numeric values used, so the audit trail shows the judge exactly why a plan was
// accepted or rejected." Approval-threshold row is informational only (§16.8).
import type { ValidationResult } from "@nexus/shared/types/validation";
import { StatusPill } from "./StatusPill";

export function ValidatorChecklist({ result }: { result: ValidationResult }): React.ReactElement {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] tracking-wide text-zinc-400 uppercase">Validator (8 checks, §16)</div>
        <StatusPill label={result.overallPassed ? "PASSED" : "FAILED"} tone={result.overallPassed ? "success" : "danger"} />
      </div>
      <ul className="space-y-1">
        {result.checks.map((check) => (
          <li key={check.name} className="grid grid-cols-[132px_1fr_44px] items-start gap-2 border-b border-zinc-100 py-1.5 text-xs">
            <span className="font-mono font-medium text-zinc-700">{check.name}</span>
            <span className="text-zinc-400">
              expected {String(check.expected)} · actual {String(check.actual)}
            </span>
            <span className={`text-right font-mono font-semibold ${check.passed ? "text-emerald-600" : "text-red-600"}`}>
              {check.passed ? "PASS" : "FAIL"}
            </span>
          </li>
        ))}
      </ul>
      {!result.overallPassed && (
        <p className="mt-2 text-xs text-zinc-400">
          approval-threshold row is informational only — it never gates pass/fail (§16.8), only EXECUTE vs ESCALATE.
        </p>
      )}
    </div>
  );
}
