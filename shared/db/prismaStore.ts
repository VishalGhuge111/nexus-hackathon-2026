// Prisma/Neon-backed Store implementation — the production path per PRD §8/§27.
// Structurally identical surface to MemoryStore; not exercised against a live
// database in this environment (no DATABASE_URL configured here), but typechecks
// against the real generated Prisma client and the same shared contracts.
import type { PrismaClient } from "@prisma/client";
import type { Case, RiskSignal } from "../types/case";
import type { AgentState } from "../types/agent";
import type { ProductionOrder } from "../types/production";
import type { InventoryRecord } from "../types/inventory";
import type { Supplier } from "../types/supplier";
import type {
  PurchaseOrder,
  RecoveryPlanVersion,
  EmergencyBudget,
  RFQ
} from "../types/procurement";
import type { ValidationResult, ApprovalRequest } from "../types/validation";
import type { AuditEvent } from "../types/audit";
import type { SupplierMessage } from "../types/supplier";
import type { Store } from "./types";

const EMERGENCY_BUDGET_ID = "EMERGENCY_BUDGET_SINGLETON";
const ACTIVE_CASE_STATUSES = [
  "OPEN",
  "MONITORING",
  "EARLY_RISK_CHECK",
  "VERIFY",
  "PLAN",
  "VALIDATE",
  "EXECUTE_OR_ESCALATE",
  "VERIFY_OUTCOME",
  "ADAPT_REPLAN",
  "QUEUED",
  "HUMAN_ESCALATED_AWAITING_DECISION"
] as const;

function toCase(row: {
  id: string;
  productionOrderId: string;
  status: string;
  priority: string;
  riskSignals: unknown;
  activePlanVersion: number;
  replanCount: number;
  continuityImpact: unknown;
  createdAt: Date;
  updatedAt: Date;
  queuedBehindCaseId: string | null;
}): Case {
  return {
    id: row.id,
    productionOrderId: row.productionOrderId,
    status: row.status as Case["status"],
    priority: row.priority as Case["priority"],
    riskSignals: row.riskSignals as RiskSignal[],
    activePlanVersion: row.activePlanVersion,
    replanCount: row.replanCount,
    continuityImpact: row.continuityImpact as Case["continuityImpact"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    queuedBehindCaseId: row.queuedBehindCaseId ?? undefined
  };
}

function toProductionOrder(row: {
  id: string;
  sku: string;
  plannedQty: number;
  bomQtyPerUnit: number;
  deadlineDate: Date;
  priority: string;
  status: string;
}): ProductionOrder {
  return {
    id: row.id,
    sku: row.sku,
    plannedQty: row.plannedQty,
    bomQtyPerUnit: row.bomQtyPerUnit,
    deadlineDate: row.deadlineDate.toISOString(),
    priority: row.priority as ProductionOrder["priority"],
    status: row.status
  };
}

function toInventoryRecord(row: {
  sku: string;
  warehouseId: string;
  currentStock: number;
  usableStock: number;
  dailyUsageRate: number;
  safetyStockThreshold: number;
  lastUpdatedAt: Date;
  stockDiscrepancyFlag: boolean | null;
}): InventoryRecord {
  return {
    sku: row.sku,
    warehouseId: row.warehouseId,
    currentStock: row.currentStock,
    usableStock: row.usableStock,
    dailyUsageRate: row.dailyUsageRate,
    safetyStockThreshold: row.safetyStockThreshold,
    lastUpdatedAt: row.lastUpdatedAt.toISOString(),
    stockDiscrepancyFlag: row.stockDiscrepancyFlag ?? undefined
  };
}

function toPurchaseOrder(row: {
  id: string;
  supplierId: string;
  sku: string;
  qty: number;
  unitPrice: number;
  status: string;
  expectedDeliveryDate: Date;
  caseId: string | null;
}): PurchaseOrder {
  return {
    id: row.id,
    supplierId: row.supplierId,
    sku: row.sku,
    qty: row.qty,
    unitPrice: row.unitPrice,
    status: row.status as PurchaseOrder["status"],
    expectedDeliveryDate: row.expectedDeliveryDate.toISOString(),
    caseId: row.caseId ?? undefined
  };
}

function toSupplier(row: {
  id: string;
  name: string;
  certifications: unknown;
  moq: number;
  maxCapacityPerCycle: number;
  defaultLeadTimeDays: number;
  reliabilityScore: number;
  qualityScore: number;
  pricePerUnit: unknown;
}): Supplier {
  return {
    id: row.id,
    name: row.name,
    certifications: row.certifications as string[],
    moq: row.moq,
    maxCapacityPerCycle: row.maxCapacityPerCycle,
    defaultLeadTimeDays: row.defaultLeadTimeDays,
    reliabilityScore: row.reliabilityScore,
    qualityScore: row.qualityScore,
    pricePerUnit: row.pricePerUnit as Record<string, number>
  };
}

function toSupplierMessage(row: {
  id: string;
  supplierId: string;
  caseId: string;
  direction: string;
  subject: string;
  body: string;
  extractedFields: unknown;
  contradictionFlag: boolean | null;
  sentAt: Date;
}): SupplierMessage {
  return {
    id: row.id,
    supplierId: row.supplierId,
    caseId: row.caseId,
    direction: row.direction as SupplierMessage["direction"],
    subject: row.subject,
    body: row.body,
    extractedFields: row.extractedFields as Record<string, unknown> | undefined,
    contradictionFlag: row.contradictionFlag ?? undefined,
    sentAt: row.sentAt.toISOString()
  };
}

function toRfq(row: {
  id: string;
  caseId: string;
  sku: string;
  qty: number;
  neededBy: Date;
  supplierIds: unknown;
  status: string;
  responses: unknown;
}): RFQ {
  return {
    id: row.id,
    caseId: row.caseId,
    sku: row.sku,
    qty: row.qty,
    neededBy: row.neededBy.toISOString(),
    supplierIds: row.supplierIds as string[],
    status: row.status as RFQ["status"],
    responses: row.responses as RFQ["responses"]
  };
}

function toAgentState(row: {
  caseId: string;
  currentStep: string;
  cycle: number;
  lastToolCalls: unknown;
  toolCallCount: number;
  lastLlmModel: string | null;
  pendingLlmTask: string | null;
  updatedAt: Date;
}): AgentState {
  return {
    caseId: row.caseId,
    currentStep: row.currentStep as AgentState["currentStep"],
    cycle: row.cycle,
    lastToolCalls: row.lastToolCalls as string[],
    toolCallCount: row.toolCallCount,
    lastLlmModel: (row.lastLlmModel as AgentState["lastLlmModel"]) ?? undefined,
    pendingLlmTask: row.pendingLlmTask ?? undefined,
    updatedAt: row.updatedAt.toISOString()
  };
}

function toEmergencyBudget(row: {
  totalAmount: number;
  reservedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  updatedAt: Date;
}): EmergencyBudget {
  return {
    totalAmount: row.totalAmount,
    reservedAmount: row.reservedAmount,
    spentAmount: row.spentAmount,
    remainingAmount: row.remainingAmount,
    updatedAt: row.updatedAt.toISOString()
  };
}

function toAuditEvent(row: {
  id: string;
  caseId: string;
  cycle: number;
  timestamp: Date;
  actor: string;
  type: string;
  summary: string;
  detail: unknown;
}): AuditEvent {
  return {
    id: row.id,
    caseId: row.caseId,
    cycle: row.cycle,
    timestamp: row.timestamp.toISOString(),
    actor: row.actor as AuditEvent["actor"],
    type: row.type as AuditEvent["type"],
    summary: row.summary,
    detail: row.detail as Record<string, unknown>
  };
}

export class PrismaStore implements Store {
  constructor(private readonly prisma: PrismaClient) {}

  async getCase(id: string): Promise<Case | null> {
    const row = await this.prisma.case.findUnique({ where: { id } });
    return row ? toCase(row) : null;
  }

  async listActiveCases(): Promise<Case[]> {
    const rows = await this.prisma.case.findMany({
      where: { status: { in: [...ACTIVE_CASE_STATUSES] } }
    });
    return rows.map(toCase);
  }

  async findCaseByProductionOrder(productionOrderId: string): Promise<Case | null> {
    const row = await this.prisma.case.findFirst({
      where: { productionOrderId, status: { in: [...ACTIVE_CASE_STATUSES] } }
    });
    return row ? toCase(row) : null;
  }

  async createCase(input: Case): Promise<Case> {
    const row = await this.prisma.case.create({
      data: {
        id: input.id,
        productionOrderId: input.productionOrderId,
        status: input.status,
        priority: input.priority,
        riskSignals: input.riskSignals as object[],
        activePlanVersion: input.activePlanVersion,
        replanCount: input.replanCount,
        continuityImpact: input.continuityImpact,
        createdAt: new Date(input.createdAt),
        updatedAt: new Date(input.updatedAt),
        queuedBehindCaseId: input.queuedBehindCaseId ?? null
      }
    });
    return toCase(row);
  }

  async updateCase(id: string, patch: Partial<Case>): Promise<Case> {
    const row = await this.prisma.case.update({
      where: { id },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
        ...(patch.riskSignals !== undefined ? { riskSignals: patch.riskSignals as object[] } : {}),
        ...(patch.activePlanVersion !== undefined
          ? { activePlanVersion: patch.activePlanVersion }
          : {}),
        ...(patch.replanCount !== undefined ? { replanCount: patch.replanCount } : {}),
        ...(patch.continuityImpact !== undefined
          ? { continuityImpact: patch.continuityImpact }
          : {}),
        ...(patch.queuedBehindCaseId !== undefined
          ? { queuedBehindCaseId: patch.queuedBehindCaseId }
          : {}),
        updatedAt: new Date()
      }
    });
    return toCase(row);
  }

  async addRiskSignal(caseId: string, signal: RiskSignal): Promise<void> {
    const existing = await this.prisma.case.findUniqueOrThrow({ where: { id: caseId } });
    const current = existing.riskSignals as unknown as RiskSignal[];
    await this.prisma.case.update({
      where: { id: caseId },
      data: { riskSignals: [...current, signal] as object[], updatedAt: new Date() }
    });
    await this.prisma.riskSignal.create({
      data: {
        id: signal.id,
        caseId,
        indicator: signal.indicator,
        value: signal.value,
        threshold: signal.threshold,
        cycle: signal.cycle,
        timestamp: new Date(signal.timestamp),
        source: signal.source
      }
    });
  }

  async getAgentState(caseId: string): Promise<AgentState | null> {
    const row = await this.prisma.agentState.findUnique({ where: { caseId } });
    return row ? toAgentState(row) : null;
  }

  async upsertAgentState(state: AgentState): Promise<AgentState> {
    const row = await this.prisma.agentState.upsert({
      where: { caseId: state.caseId },
      create: {
        caseId: state.caseId,
        currentStep: state.currentStep,
        cycle: state.cycle,
        lastToolCalls: state.lastToolCalls,
        toolCallCount: state.toolCallCount,
        lastLlmModel: state.lastLlmModel ?? null,
        pendingLlmTask: state.pendingLlmTask ?? null,
        updatedAt: new Date(state.updatedAt)
      },
      update: {
        currentStep: state.currentStep,
        cycle: state.cycle,
        lastToolCalls: state.lastToolCalls,
        toolCallCount: state.toolCallCount,
        lastLlmModel: state.lastLlmModel ?? null,
        pendingLlmTask: state.pendingLlmTask ?? null,
        updatedAt: new Date(state.updatedAt)
      }
    });
    return toAgentState(row);
  }

  async getProductionOrder(id: string): Promise<ProductionOrder | null> {
    const row = await this.prisma.productionOrder.findUnique({ where: { id } });
    return row ? toProductionOrder(row) : null;
  }

  async findProductionOrderBySku(sku: string): Promise<ProductionOrder | null> {
    const row = await this.prisma.productionOrder.findFirst({ where: { sku } });
    return row ? toProductionOrder(row) : null;
  }

  async getInventoryRecordBySku(sku: string): Promise<InventoryRecord | null> {
    const row = await this.prisma.inventoryRecord.findFirst({ where: { sku } });
    return row ? toInventoryRecord(row) : null;
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
    const row = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    return row ? toPurchaseOrder(row) : null;
  }

  async listPurchaseOrdersByCase(caseId: string): Promise<PurchaseOrder[]> {
    const rows = await this.prisma.purchaseOrder.findMany({ where: { caseId } });
    return rows.map(toPurchaseOrder);
  }

  async createPurchaseOrder(po: PurchaseOrder): Promise<PurchaseOrder> {
    const row = await this.prisma.purchaseOrder.create({
      data: {
        id: po.id,
        supplierId: po.supplierId,
        sku: po.sku,
        qty: po.qty,
        unitPrice: po.unitPrice,
        status: po.status,
        expectedDeliveryDate: new Date(po.expectedDeliveryDate),
        caseId: po.caseId ?? null
      }
    });
    return toPurchaseOrder(row);
  }

  async updatePurchaseOrder(id: string, patch: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const row = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.qty !== undefined ? { qty: patch.qty } : {}),
        ...(patch.unitPrice !== undefined ? { unitPrice: patch.unitPrice } : {}),
        ...(patch.expectedDeliveryDate !== undefined
          ? { expectedDeliveryDate: new Date(patch.expectedDeliveryDate) }
          : {}),
        ...(patch.caseId !== undefined ? { caseId: patch.caseId } : {})
      }
    });
    return toPurchaseOrder(row);
  }

  async getSupplier(id: string): Promise<Supplier | null> {
    const row = await this.prisma.supplier.findUnique({ where: { id } });
    return row ? toSupplier(row) : null;
  }

  async listSuppliers(): Promise<Supplier[]> {
    const rows = await this.prisma.supplier.findMany();
    return rows.map(toSupplier);
  }

  async updateSupplier(id: string, patch: Partial<Supplier>): Promise<Supplier> {
    const row = await this.prisma.supplier.update({
      where: { id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.certifications !== undefined ? { certifications: patch.certifications } : {}),
        ...(patch.moq !== undefined ? { moq: patch.moq } : {}),
        ...(patch.maxCapacityPerCycle !== undefined ? { maxCapacityPerCycle: patch.maxCapacityPerCycle } : {}),
        ...(patch.defaultLeadTimeDays !== undefined ? { defaultLeadTimeDays: patch.defaultLeadTimeDays } : {}),
        ...(patch.reliabilityScore !== undefined ? { reliabilityScore: patch.reliabilityScore } : {}),
        ...(patch.qualityScore !== undefined ? { qualityScore: patch.qualityScore } : {}),
        ...(patch.pricePerUnit !== undefined ? { pricePerUnit: patch.pricePerUnit } : {})
      }
    });
    return toSupplier(row);
  }

  async createSupplierMessage(msg: SupplierMessage): Promise<void> {
    await this.prisma.supplierMessage.create({
      data: {
        id: msg.id,
        supplierId: msg.supplierId,
        caseId: msg.caseId,
        direction: msg.direction === 'OUTBOUND' ? 'OUTBOUND' : 'INBOUND',
        subject: msg.subject,
        body: msg.body,
        extractedFields: msg.extractedFields ? (msg.extractedFields as object) : undefined,
        contradictionFlag: msg.contradictionFlag ?? null,
        sentAt: new Date(msg.sentAt)
      }
    });
  }

  async listSupplierMessagesByCase(caseId: string): Promise<SupplierMessage[]> {
    const rows = await this.prisma.supplierMessage.findMany({ where: { caseId } });
    return rows.map(toSupplierMessage);
  }

  async createRfq(rfq: RFQ): Promise<void> {
    await this.prisma.rFQ.create({
      data: {
        id: rfq.id,
        caseId: rfq.caseId,
        sku: rfq.sku,
        qty: rfq.qty,
        neededBy: new Date(rfq.neededBy),
        supplierIds: rfq.supplierIds,
        status: rfq.status === 'OPEN' ? 'OPEN' : 'CLOSED',
        responses: rfq.responses as object[]
      }
    });
  }

  async listRfqsByCase(caseId: string): Promise<RFQ[]> {
    const rows = await this.prisma.rFQ.findMany({ where: { caseId } });
    return rows.map(toRfq);
  }

  async updateRfq(id: string, patch: Partial<RFQ>): Promise<RFQ> {
    const row = await this.prisma.rFQ.update({
      where: { id },
      data: {
        ...(patch.status !== undefined ? { status: patch.status === 'OPEN' ? 'OPEN' : 'CLOSED' } : {}),
        ...(patch.responses !== undefined ? { responses: patch.responses as object[] } : {})
      }
    });
    return toRfq(row);
  }

  async getEmergencyBudget(): Promise<EmergencyBudget> {
    const row = await this.prisma.emergencyBudget.findUnique({
      where: { id: EMERGENCY_BUDGET_ID }
    });
    if (!row) {
      const created = await this.prisma.emergencyBudget.create({
        data: {
          id: EMERGENCY_BUDGET_ID,
          totalAmount: 0,
          reservedAmount: 0,
          spentAmount: 0,
          remainingAmount: 0,
          updatedAt: new Date()
        }
      });
      return toEmergencyBudget(created);
    }
    return toEmergencyBudget(row);
  }

  async updateEmergencyBudget(patch: Partial<EmergencyBudget>): Promise<EmergencyBudget> {
    const current = await this.getEmergencyBudget();
    const merged = { ...current, ...patch };
    const remainingAmount = merged.totalAmount - merged.reservedAmount - merged.spentAmount;
    const row = await this.prisma.emergencyBudget.upsert({
      where: { id: EMERGENCY_BUDGET_ID },
      create: {
        id: EMERGENCY_BUDGET_ID,
        totalAmount: merged.totalAmount,
        reservedAmount: merged.reservedAmount,
        spentAmount: merged.spentAmount,
        remainingAmount,
        updatedAt: new Date()
      },
      update: {
        totalAmount: merged.totalAmount,
        reservedAmount: merged.reservedAmount,
        spentAmount: merged.spentAmount,
        remainingAmount,
        updatedAt: new Date()
      }
    });
    return toEmergencyBudget(row);
  }

  async createRecoveryPlanVersion(v: RecoveryPlanVersion & { id: string }): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.recoveryPlanVersion.updateMany({
        where: { caseId: v.caseId, status: "ACTIVE" },
        data: { status: "SUPERSEDED" }
      }),
      this.prisma.recoveryPlanVersion.create({
        data: {
          id: v.id,
          version: v.version,
          caseId: v.caseId,
          parent_version: v.parent_version,
          plan: v.plan as object,
          invalidated_assumptions: v.invalidated_assumptions,
          carried_forward_actions: v.carried_forward_actions,
          reason_for_change: v.reason_for_change,
          triggering_event: v.triggering_event,
          status: v.status,
          createdAt: new Date(v.createdAt)
        }
      })
    ]);
  }

  async getActivePlanVersion(
    caseId: string
  ): Promise<(RecoveryPlanVersion & { id: string }) | null> {
    const row = await this.prisma.recoveryPlanVersion.findFirst({
      where: { caseId, status: "ACTIVE" }
    });
    if (!row) return null;
    return {
      id: row.id,
      version: row.version,
      caseId: row.caseId,
      parent_version: row.parent_version,
      plan: row.plan as unknown as RecoveryPlanVersion["plan"],
      invalidated_assumptions: row.invalidated_assumptions as string[],
      carried_forward_actions: row.carried_forward_actions as string[],
      reason_for_change: row.reason_for_change,
      triggering_event: row.triggering_event,
      status: row.status as RecoveryPlanVersion["status"],
      createdAt: row.createdAt.toISOString()
    };
  }

  async listPlanVersions(caseId: string): Promise<(RecoveryPlanVersion & { id: string })[]> {
    const rows = await this.prisma.recoveryPlanVersion.findMany({
      where: { caseId },
      orderBy: { version: "asc" }
    });
    return rows.map((row) => ({
      id: row.id,
      version: row.version,
      caseId: row.caseId,
      parent_version: row.parent_version,
      plan: row.plan as unknown as RecoveryPlanVersion["plan"],
      invalidated_assumptions: row.invalidated_assumptions as string[],
      carried_forward_actions: row.carried_forward_actions as string[],
      reason_for_change: row.reason_for_change,
      triggering_event: row.triggering_event,
      status: row.status as RecoveryPlanVersion["status"],
      createdAt: row.createdAt.toISOString()
    }));
  }

  async createValidationResult(result: ValidationResult & { id: string }): Promise<void> {
    await this.prisma.validationResult.create({
      data: {
        id: result.id,
        planVersionId: result.planVersionId,
        checks: result.checks,
        overallPassed: result.overallPassed,
        withinApprovalThreshold: result.withinApprovalThreshold
      }
    });
  }

  async getLatestValidationResult(planVersionId: string): Promise<ValidationResult | null> {
    const row = await this.prisma.validationResult.findFirst({
      where: { planVersionId },
      orderBy: { id: "desc" }
    });
    if (!row) return null;
    return {
      planVersionId: row.planVersionId,
      checks: row.checks as ValidationResult["checks"],
      overallPassed: row.overallPassed,
      withinApprovalThreshold: row.withinApprovalThreshold
    };
  }

  async createApprovalRequest(req: ApprovalRequest): Promise<ApprovalRequest> {
    const row = await this.prisma.approvalRequest.create({
      data: {
        id: req.id,
        caseId: req.caseId,
        planVersionId: req.planVersionId,
        brief: req.brief,
        status: req.status,
        resolvedBy: req.resolvedBy ?? null,
        resolvedAt: req.resolvedAt ? new Date(req.resolvedAt) : null
      }
    });
    return {
      ...row,
      resolvedBy: row.resolvedBy ?? undefined,
      resolvedAt: row.resolvedAt?.toISOString(),
      status: row.status as ApprovalRequest["status"]
    };
  }

  async getApprovalRequest(id: string): Promise<ApprovalRequest | null> {
    const row = await this.prisma.approvalRequest.findUnique({ where: { id } });
    if (!row) return null;
    return {
      ...row,
      resolvedBy: row.resolvedBy ?? undefined,
      resolvedAt: row.resolvedAt?.toISOString(),
      status: row.status as ApprovalRequest["status"]
    };
  }

  async updateApprovalRequest(id: string, patch: Partial<ApprovalRequest>): Promise<ApprovalRequest> {
    const row = await this.prisma.approvalRequest.update({
      where: { id },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.resolvedBy !== undefined ? { resolvedBy: patch.resolvedBy } : {}),
        ...(patch.resolvedAt !== undefined
          ? { resolvedAt: patch.resolvedAt ? new Date(patch.resolvedAt) : null }
          : {})
      }
    });
    return {
      ...row,
      resolvedBy: row.resolvedBy ?? undefined,
      resolvedAt: row.resolvedAt?.toISOString(),
      status: row.status as ApprovalRequest["status"]
    };
  }

  async getPendingApprovalForCase(caseId: string): Promise<ApprovalRequest | null> {
    const row = await this.prisma.approvalRequest.findFirst({
      where: { caseId, status: "PENDING" }
    });
    if (!row) return null;
    return {
      ...row,
      resolvedBy: row.resolvedBy ?? undefined,
      resolvedAt: row.resolvedAt?.toISOString(),
      status: row.status as ApprovalRequest["status"]
    };
  }

  async appendAuditEvent(event: AuditEvent): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        id: event.id,
        caseId: event.caseId,
        cycle: event.cycle,
        timestamp: new Date(event.timestamp),
        actor: event.actor,
        type: event.type,
        summary: event.summary,
        detail: event.detail as object
      }
    });
  }

  async listAuditEvents(caseId: string): Promise<AuditEvent[]> {
    const rows = await this.prisma.auditEvent.findMany({
      where: { caseId },
      orderBy: { timestamp: "asc" }
    });
    return rows.map(toAuditEvent);
  }
}
