import type { ValidationResult } from "@nexus/shared/types/validation";
import { StatusPill } from "./StatusPill";
import { CheckCircle2, XCircle } from "lucide-react";

export function ValidatorChecklist({ result }: { result: ValidationResult }): React.ReactElement {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Deterministic Constraint Engine (8 Checks)
        </div>
        <StatusPill
          label={result.overallPassed ? "ALL CONSTRAINTS PASSED" : "CONSTRAINTS REJECTED"}
          tone={result.overallPassed ? "success" : "danger"}
        />
      </div>

      <ul className="space-y-1.5 divide-y divide-zinc-100">
        {result.checks.map((check) => (
          <li
            key={check.name}
            className="flex items-center justify-between gap-3 pt-1.5 first:pt-0 text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              {check.passed ? (
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              ) : (
                <XCircle size={13} className="text-red-600 shrink-0" />
              )}
              <span className="font-mono font-medium text-zinc-800 truncate">{check.name}</span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
                actual: <strong className="text-zinc-700 font-medium">{String(check.actual)}</strong> (exp: {String(check.expected)})
              </span>
              <span
                className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  check.passed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {check.passed ? "PASS" : "FAIL"}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {!result.overallPassed && (
        <p className="mt-2.5 text-[11px] text-amber-700 bg-amber-50/80 p-2 rounded border border-amber-100 leading-relaxed">
          Approval-threshold constraint triggers human escalation (EXECUTE_OR_ESCALATE) rather than outright plan invalidation.
        </p>
      )}
    </div>
  );
}