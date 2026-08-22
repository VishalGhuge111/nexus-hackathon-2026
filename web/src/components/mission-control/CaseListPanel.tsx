"use client";

// PRD §28 — "Left panel — Case list: Orders at Risk, Deadline Risk, sorted by
// continuity impact; QUEUED cases visibly stacked below the active one."

import type { Case } from "@nexus/shared/types/case";
import { Panel } from "./Panel";
import { StatusPill, caseStatusTone } from "./StatusPill";

export function CaseListPanel({
  cases,
  selectedCaseId,
  onSelect
}: {
  cases: Case[];
  selectedCaseId: string | null;
  onSelect: (caseId: string) => void;
}): React.ReactElement {
  const active = cases.filter((c) => c.status !== "QUEUED");
  const queued = cases.filter((c) => c.status === "QUEUED");
  const sortedActive = [...active].sort(
    (a, b) => b.continuityImpact.unitsAtRisk - a.continuityImpact.unitsAtRisk
  );

  return (
    <Panel title="Cases" subtitle="Sorted by continuity impact (units at risk)" tone="primary">
      <ul className="space-y-2">
        {sortedActive.map((c) => (
          <CaseCard key={c.id} caseRecord={c} selected={c.id === selectedCaseId} onSelect={onSelect} />
        ))}
      </ul>

      {queued.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">Queued behind active case</div>
          <ul className="space-y-2 border-l-2 border-slate-800 pl-3">
            {queued.map((c) => (
              <CaseCard key={c.id} caseRecord={c} selected={c.id === selectedCaseId} onSelect={onSelect} />
            ))}
          </ul>
        </div>
      )}

      {cases.length === 0 && <p className="text-sm text-slate-500">No active cases.</p>}
    </Panel>
  );
}

function CaseCard({
  caseRecord,
  selected,
  onSelect
}: {
  caseRecord: Case;
  selected: boolean;
  onSelect: (caseId: string) => void;
}): React.ReactElement {
  return (
    <li
      onClick={() => onSelect(caseRecord.id)}
      className={`cursor-pointer rounded-lg border p-2.5 text-sm transition-colors ${
        selected ? "border-sky-600 bg-slate-900 ring-1 ring-sky-600/40" : "border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-slate-400">{caseRecord.id}</span>
        <StatusPill label={caseRecord.status.replace(/_/g, " ")} tone={caseStatusTone(caseRecord.status)} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
        <span>{caseRecord.priority}</span>
        <span>
          {caseRecord.continuityImpact.unitsAtRisk} units at risk
          {caseRecord.continuityImpact.deadlineBreached ? " · deadline breached" : ""}
        </span>
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        plan v{caseRecord.activePlanVersion} · {caseRecord.replanCount} replan(s)
        {caseRecord.queuedBehindCaseId && <> · queued behind {caseRecord.queuedBehindCaseId}</>}
      </div>
    </li>
  );
}
