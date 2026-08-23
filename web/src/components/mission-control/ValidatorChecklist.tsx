'use client';
import React, { useState } from 'react';
import type { ValidationResult } from "@nexus/shared/types/validation";
import { StatusPill } from "./StatusPill";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

interface CheckMeta {
  title: string;
  description: string;
}

const CHECK_DESCRIPTIONS: Record<string, CheckMeta> = {
  coverage: {
    title: "Stock & Order Coverage",
    description: "Combined usable stock + new order meets total production requirement"
  },
  deadline: {
    title: "Delivery Timeline",
    description: "Supplier delivery ETA arrives on or before the manufacturing deadline"
  },
  moq: {
    title: "Minimum Order Quantity (MOQ)",
    description: "Purchase quantity satisfies the supplier's minimum order batch size"
  },
  certification: {
    title: "Quality Certifications",
    description: "Vendor holds active ISO-9001 and automotive manufacturing standards"
  },
  budget: {
    title: "Emergency Budget Limit",
    description: "Total recovery cost is within the remaining emergency reserve fund"
  },
  splitAllocation: {
    title: "Supplier Capacity Allocation",
    description: "Order quantity does not exceed the supplier's maximum cycle capacity"
  },
  freshness: {
    title: "Telemetry Data Freshness",
    description: "Calculations use verified physical warehouse scan data from active cycle"
  },
  approvalThreshold: {
    title: "Governance Approval Policy",
    description: "Orders over ₹10,000 threshold are gated for operator sign-off"
  }
};

export function ValidatorChecklist({ result }: { result: ValidationResult }): React.ReactElement {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-blue-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
            Deterministic Constraint Engine (8 Checks)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="cursor-pointer text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200/70 px-2 py-0.5 rounded transition-colors"
          >
            <span>{showTechnicalDetails ? "Simple View" : "Technical Math"}</span>
            {showTechnicalDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <StatusPill
            label={result.overallPassed ? "ALL 8 CHECKS PASSED" : "CONSTRAINTS REJECTED"}
            tone={result.overallPassed ? "success" : "danger"}
          />
        </div>
      </div>

      <ul className="space-y-2 divide-y divide-zinc-100">
        {result.checks.map((check) => {
          const meta = CHECK_DESCRIPTIONS[check.name] ?? {
            title: check.name,
            description: "Deterministic validation rule"
          };

          return (
            <li
              key={check.name}
              className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5">
                  {check.passed ? (
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle size={15} className="text-red-600 shrink-0" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 text-xs">{meta.title}</span>
                    <span className="text-[10px] font-mono text-zinc-400">({check.name})</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                    {meta.description}
                  </p>

                  {/* Optional Technical math expansion */}
                  {showTechnicalDetails && (
                    <div className="mt-1 text-[10px] font-mono text-zinc-600 bg-zinc-50 p-1.5 rounded border border-zinc-200/60 inline-block">
                      <span>actual: </span>
                      <strong className="text-zinc-800">{String(check.actual)}</strong>
                      <span className="text-zinc-400"> | expected: {String(check.expected)}</span>
                    </div>
                  )}
                </div>
              </div>

              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                  check.passed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {check.passed ? "PASS" : "FAIL"}
              </span>
            </li>
          );
        })}
      </ul>

      {!result.overallPassed && (
        <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
          <strong>Governance Notice:</strong> Policy threshold requires authorized human approval (Stage 5) before purchase execution.
        </p>
      )}
    </div>
  );
}