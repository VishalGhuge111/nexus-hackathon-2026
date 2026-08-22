'use client';

import { useEffect, useState } from 'react';
import type { AgentState } from '@nexus/shared/types/agent';
import type { ApprovalRequest } from '@nexus/shared/types/validation';
import type { AuditEvent } from '@nexus/shared/types/audit';
import type { ProductionOrder } from '@nexus/shared/types/production';
import type { InventoryRecord } from '@nexus/shared/types/inventory';
import type { PurchaseOrder, RecoveryPlanVersion } from '@nexus/shared/types/procurement';
import type { Case } from '@nexus/shared/types/case';

export type ApprovalDecision = 'APPROVED' | 'REJECTED';

export interface DashboardSummaryCase {
  id: string;
  status: string;
  priority: string;
  continuityImpact: {
    unitsAtRisk: number;
    deadlineBreached: boolean;
  };
  activePlanVersion: number | null;
  replanCount: number;
  queuedBehindCaseId?: string | null;
}

export interface DashboardSummary {
  kpis: {
    coverageDaysRemaining: number | null;
    ordersAtRiskCount: number;
    unitsAtRisk: number;
    deadlinesBreachedCount: number;
    emergencyBudgetRemaining: number;
  };
  cases: DashboardSummaryCase[];
  activeCases: DashboardSummaryCase[];
}

export interface CaseDetail {
  caseRecord: Case;
  agentState: AgentState | null;
  activePlanVersion: (RecoveryPlanVersion & { id: string }) | null;
  planVersions: Array<RecoveryPlanVersion & { id: string }>;
  latestValidationResult: { planVersionId: string; checks: Array<{ name: string; passed: boolean; expected: number | string; actual: number | string }>; overallPassed: boolean; withinApprovalThreshold: boolean } | null;
  pendingApproval: ApprovalRequest | null;
  purchaseOrders: PurchaseOrder[];
  productionOrder: ProductionOrder | null;
  inventory: InventoryRecord | null;
  doNothingVsNexus: {
    doNothing: { coverageDays: number | null; deadlineBreached: boolean; unitsAtRisk: number; costImpact: number };
    nexusPlan: { coverageDays: number | null; deadlineBreached: boolean; unitsAtRisk: number; costImpact: number };
  } | null;
  auditEvents: AuditEvent[];
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch('/api/dashboard/summary');
  if (!response.ok) {
    throw new Error(`Failed to load dashboard summary: ${response.status}`);
  }

  const json = (await response.json()) as Partial<DashboardSummary>;
  const cases = json.cases ?? [];
  return {
    ...json,
    cases,
    activeCases: json.activeCases ?? cases
  } as DashboardSummary;
}

export async function fetchCaseDetail(caseId: string): Promise<CaseDetail> {
  const response = await fetch(`/api/cases/${caseId}`);
  if (!response.ok) {
    throw new Error(`Failed to load case ${caseId}: ${response.status}`);
  }

  const json = (await response.json()) as {
    case?: Case;
    caseRecord?: Case;
    agentState?: AgentState | null;
    activePlanVersion?: (RecoveryPlanVersion & { id: string }) | null;
    planVersions?: Array<RecoveryPlanVersion & { id: string }>;
    latestValidationResult?: CaseDetail['latestValidationResult'];
    pendingApproval?: ApprovalRequest | null;
    purchaseOrders?: PurchaseOrder[];
    productionOrder?: ProductionOrder | null;
    inventory?: InventoryRecord | null;
    doNothingVsNexus?: CaseDetail['doNothingVsNexus'];
    auditEvents?: AuditEvent[];
  };

  return {
    caseRecord: json.case ?? json.caseRecord ?? ({} as Case),
    agentState: json.agentState ?? null,
    activePlanVersion: json.activePlanVersion ?? null,
    planVersions: json.planVersions ?? [],
    latestValidationResult: json.latestValidationResult ?? null,
    pendingApproval: json.pendingApproval ?? null,
    purchaseOrders: json.purchaseOrders ?? [],
    productionOrder: json.productionOrder ?? null,
    inventory: json.inventory ?? null,
    doNothingVsNexus: json.doNothingVsNexus ?? null,
    auditEvents: json.auditEvents ?? []
  };
}

export async function resolveApproval(caseId: string, decision: ApprovalDecision): Promise<{ case: Case }> {
  const response = await fetch(`/api/approvals/${caseId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, resolvedBy: 'ops-controller' })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Approval request failed: ${response.status}`);
  }

  return (await response.json()) as { case: Case };
}

export function usePolling<T>(url: string, intervalMs = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        const payload = (await response.json()) as T;
        if (!isCancelled) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, intervalMs);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, [intervalMs, url]);

  return { data, isLoading, error, refresh: async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    const payload = (await response.json()) as T;
    setData(payload);
    setError(null);
    return payload;
  } };
}
