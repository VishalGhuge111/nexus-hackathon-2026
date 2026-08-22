'use client';

import { useEffect, useState } from 'react';
import type { AgentState } from '@nexus/shared/types/agent';
import type { ApprovalRequest } from '@nexus/shared/types/validation';
import type { AuditEvent } from '@nexus/shared/types/audit';
import type { ProductionOrder } from '@nexus/shared/types/production';
import type { InventoryRecord } from '@nexus/shared/types/inventory';
import type { PurchaseOrder, RecoveryPlanVersion, RFQ } from '@nexus/shared/types/procurement';
import type { Case } from '@nexus/shared/types/case';
import type { Supplier } from '@nexus/shared/types/supplier';
import type { EligibilityResult } from '@nexus/shared/supplier';
import { ORIGINAL_PO_ID, ORIGINAL_SUPPLIER_ID, ALTERNATE_SUPPLIER_ID, PRODUCTION_ORDER_ID } from '@nexus/shared/db/demoSeed';

export { ORIGINAL_PO_ID, ORIGINAL_SUPPLIER_ID, ALTERNATE_SUPPLIER_ID, PRODUCTION_ORDER_ID };

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
  rfqs: RFQ[];
  supplierEligibility: { supplier: Supplier; result: EligibilityResult }[];
  disruptedSupplierId: string | null;
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
    rfqs?: RFQ[];
    supplierEligibility?: { supplier: Supplier; result: EligibilityResult }[];
    disruptedSupplierId?: string | null;
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
    auditEvents: json.auditEvents ?? [],
    rfqs: json.rfqs ?? [],
    supplierEligibility: json.supplierEligibility ?? [],
    disruptedSupplierId: json.disruptedSupplierId ?? null
  };
}

// The route path segment is the ApprovalRequest id (see shared/agent/approvals.ts),
// not the Case id — passing a Case id here 404s ("ApprovalRequest ... not found").
export async function resolveApproval(approvalRequestId: string, decision: ApprovalDecision): Promise<{ case: Case }> {
  const response = await fetch(`/api/approvals/${approvalRequestId}/resolve`, {
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

// ---------------------------------------------------------------------------
// Real event trigger — POST /api/agent/event (shared/agent/events.ts). This is
// the same contract the README documents for curl; the UI now offers it as a
// real control instead of requiring a terminal.
// ---------------------------------------------------------------------------

async function postAgentEvent(type: string, payload: Record<string, unknown>): Promise<{ caseId: string; case: Case }> {
  const response = await fetch('/api/agent/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, payload })
  });
  const json = await response.json();
  if (!response.ok || !json.caseId) {
    throw new Error(json.error ?? `Failed to trigger event: ${response.status}`);
  }
  return json as { caseId: string; case: Case };
}

export async function triggerShipmentDelay(delayHours = 24): Promise<{ caseId: string; case: Case }> {
  return postAgentEvent('SHIPMENT_DELAY', { poId: ORIGINAL_PO_ID, delayHours });
}

// supplier-orbital's real seeded maxCapacityPerCycle (shared/db/demoSeed.ts) is
// 1000 — computing the post-drop target off that real known base rather than
// re-fetching it keeps this a single-request trigger.
const ORIGINAL_SUPPLIER_BASE_CAPACITY = 1000;

export async function triggerSupplierCapacityDrop(capacityDropPercent = 50): Promise<{ caseId: string; case: Case }> {
  return postAgentEvent('SUPPLIER_CAPACITY_DROP', {
    supplierId: ORIGINAL_SUPPLIER_ID,
    productionOrderId: PRODUCTION_ORDER_ID,
    capacityDropPercent,
    newMaxCapacityPerCycle: Math.round(ORIGINAL_SUPPLIER_BASE_CAPACITY * (1 - capacityDropPercent / 100))
  });
}

export async function triggerDemandSpike(usageIncreasePercent = 30): Promise<{ caseId: string; case: Case }> {
  return postAgentEvent('DEMAND_SPIKE', { productionOrderId: PRODUCTION_ORDER_ID, usageIncreasePercent });
}

export async function triggerSupplierClaimContradiction(): Promise<{ caseId: string; case: Case }> {
  return postAgentEvent('SUPPLIER_CLAIM_CONTRADICTION', {
    poId: ORIGINAL_PO_ID,
    supplierId: ALTERNATE_SUPPLIER_ID,
    productionOrderId: PRODUCTION_ORDER_ID,
    claimedStatus: 'dispatched, in transit',
    trackingStatus: 'label created, no carrier pickup scanned'
  });
}

// ---------------------------------------------------------------------------
// Suppliers / Orders / Audit / Analytics / System status — thin real reads
// backed by shared/db (see web/src/app/api/**/route.ts for each contract).
// ---------------------------------------------------------------------------

export async function fetchSuppliers(): Promise<Supplier[]> {
  const response = await fetch('/api/suppliers');
  if (!response.ok) throw new Error(`Failed to load suppliers: ${response.status}`);
  const json = (await response.json()) as { suppliers: Supplier[] };
  return json.suppliers;
}

export async function fetchOrders(): Promise<PurchaseOrder[]> {
  const response = await fetch('/api/orders');
  if (!response.ok) throw new Error(`Failed to load orders: ${response.status}`);
  const json = (await response.json()) as { purchaseOrders: PurchaseOrder[] };
  return json.purchaseOrders;
}

export async function fetchAllAuditEvents(): Promise<AuditEvent[]> {
  const response = await fetch('/api/audit');
  if (!response.ok) throw new Error(`Failed to load audit log: ${response.status}`);
  const json = (await response.json()) as { auditEvents: AuditEvent[] };
  return json.auditEvents;
}

export interface AnalyticsWeekBucket {
  weekStart: string;
  weekEnd: string;
  casesCreated: number;
  successfulRecoveries: number;
  noFeasibleRecoveries: number;
  approvalsGranted: number;
  approvalsRejected: number;
  failedValidations: number;
}

export interface AnalyticsSummary {
  weeks: number;
  windowStart: string;
  windowEnd: string;
  totalCasesAllTime: number;
  totalAuditEventsAllTime: number;
  buckets: AnalyticsWeekBucket[];
  totals: Omit<AnalyticsWeekBucket, 'weekStart' | 'weekEnd'>;
}

export async function fetchAnalyticsSummary(weeks = 4): Promise<AnalyticsSummary> {
  const response = await fetch(`/api/analytics/summary?weeks=${weeks}`);
  if (!response.ok) throw new Error(`Failed to load analytics: ${response.status}`);
  return (await response.json()) as AnalyticsSummary;
}

export interface SystemStatus {
  database: { mode: 'neon' | 'memory'; configured: boolean; description: string };
  llm: { mode: 'anthropic' | 'stub'; configured: boolean; model: string | null; description: string };
  agentConfig: {
    maxToolCallsPerCase: number;
    maxReplans: number;
    approvalThreshold: number;
    minSupplierQualityForCase: number;
    minSupplierReliabilityForCase: number;
  };
  runtime: { nodeVersion: string; environment: string };
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const response = await fetch('/api/system/status');
  if (!response.ok) throw new Error(`Failed to load system status: ${response.status}`);
  return (await response.json()) as SystemStatus;
}
