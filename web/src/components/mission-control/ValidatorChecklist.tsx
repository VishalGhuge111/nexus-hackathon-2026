// PRD §16 — "Output: ValidationResult listing every check with pass/fail and the
// numeric values used, so the audit trail shows the judge exactly why a plan was
// accepted or rejected." Approval-threshold row is informational only (§16.8).
import type { ValidationResult } from "@nexus/shared/types/validation";
import { StatusPill } from "./StatusPill";

export function ValidatorChecklist({ result }: { result: ValidationResult }): React.ReactElement {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">Validator (8 checks, §16)</div>
        <StatusPill label={result.overallPassed ? "PASSED" : "FAILED"} tone={result.overallPassed ? "success" : "danger"} />
      </div>
      <ul className="space-y-1">
        {result.checks.map((check) => (
          <li key={check.name} className="flex items-center justify-between border-b border-slate-900 py-1 text-xs">
            <span className="font-mono text-slate-300">{check.name}</span>
            <span className="text-slate-500">
              expected {String(check.expected)} · actual {String(check.actual)}
            </span>
            <span className={check.passed ? "text-emerald-400" : "text-red-400"}>{check.passed ? "PASS" : "FAIL"}</span>
          </li>
        ))}
      </ul>
      {!result.overallPassed && (
        <p className="mt-2 text-xs text-slate-500">
          approval-threshold row is informational only — it never gates pass/fail (§16.8), only EXECUTE vs ESCALATE.
        </p>
      )}
    </div>
  );
}
