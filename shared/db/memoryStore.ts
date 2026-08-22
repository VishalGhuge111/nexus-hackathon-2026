// In-memory Store implementation — lets the full agent loop run locally with zero
// external credentials. Structurally identical to the Prisma-backed store (shared/db/prismaStore.ts)
// so swapping one for the other never changes agent/FSM behavior.
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

export interface MemorySeed {
  cases?: Case[];
  agentStates?: AgentState[];
  productionOrders?: ProductionOrder[];
  inventoryRecords?: InventoryRecord[];
  suppliers?: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  emergencyBudget?: EmergencyBudget;
  supplierMessages?: SupplierMessage[];
  rfqs?: RFQ[];
}

export class MemoryStore implements Store {
  private cases = new Map<string, Case>();
  private agentStates = new Map<string, AgentState>();
  private productionOrders = new Map<string, ProductionOrder>();
  private inventoryBySku = new Map<string, InventoryRecord>();
  private suppliers = new Map<string, Supplier>();
  private purchaseOrders = new Map<string, PurchaseOrder>();
  private planVersions: (RecoveryPlanVersion & { id: string })[] = [];
  private validationResults: (ValidationResult & { id: string })[] = [];
  private approvalRequests = new Map<string, ApprovalRequest>();
  private auditEvents: AuditEvent[] = [];
  private supplierMessages: SupplierMessage[] = [];
  private rfqs = new Map<string, RFQ>();
  private emergencyBudget: EmergencyBudget = {
    totalAmount: 0,
    reservedAmount: 0,
    spentAmount: 0,
    remainingAmount: 0,
    updatedAt: new Date().toISOString()
  };

  constructor(seed?: MemorySeed) {
    seed?.cases?.forEach((c) => this.cases.set(c.id, structuredClone(c)));
    seed?.agentStates?.forEach((s) => this.agentStates.set(s.caseId, structuredClone(s)));
    seed?.productionOrders?.forEach((p) => this.productionOrders.set(p.id, structuredClone(p)));
    seed?.inventoryRecords?.forEach((i) => this.inventoryBySku.set(i.sku, structuredClone(i)));
    seed?.suppliers?.forEach((s) => this.suppliers.set(s.id, structuredClone(s)));
    seed?.purchaseOrders?.forEach((p) => this.purchaseOrders.set(p.id, structuredClone(p)));
    if (seed?.emergencyBudget) this.emergencyBudget = structuredClone(seed.emergencyBudget);
    seed?.supplierMessages?.forEach((m) => this.supplierMessages.push(structuredClone(m)));
    seed?.rfqs?.forEach((r) => this.rfqs.set(r.id, structuredClone(r)));
  }

  async getCase(id: string): Promise<Case | null> {
    const c = this.cases.get(id);
    return c ? structuredClone(c) : null;
  }

  async listActiveCases(): Promise<Case[]> {
    const terminal = new Set(["GOAL_ACHIEVED", "NO_FEASIBLE_RECOVERY"]);
    return [...this.cases.values()].filter((c) => !terminal.has(c.status)).map((c) => structuredClone(c));
  }

  async listAllCases(): Promise<Case[]> {
    return [...this.cases.values()].map((c) => structuredClone(c));
  }

  async findCaseByProductionOrder(productionOrderId: string): Promise<Case | null> {
    const terminal = new Set(["GOAL_ACHIEVED", "NO_FEASIBLE_RECOVERY"]);
    const found = [...this.cases.values()].find(
      (c) => c.productionOrderId === productionOrderId && !terminal.has(c.status)
    );
    return found ? structuredClone(found) : null;
  }

  async createCase(input: Case): Promise<Case> {
    this.cases.set(input.id, structuredClone(input));
    return structuredClone(input);
  }

  async updateCase(id: string, patch: Partial<Case>): Promise<Case> {
    const existing = this.cases.get(id);
    if (!existing) throw new Error(`Case ${id} not found`);
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.cases.set(id, updated);
    return structuredClone(updated);
  }

  async addRiskSignal(caseId: string, signal: RiskSignal): Promise<void> {
    const existing = this.cases.get(caseId);
    if (!existing) throw new Error(`Case ${caseId} not found`);
    existing.riskSignals = [...existing.riskSignals, signal];
    existing.updatedAt = new Date().toISOString();
  }

  async getAgentState(caseId: string): Promise<AgentState | null> {
    const s = this.agentStates.get(caseId);
    return s ? structuredClone(s) : null;
  }

  async upsertAgentState(state: AgentState): Promise<AgentState> {
    this.agentStates.set(state.caseId, structuredClone(state));
    return structuredClone(state);
  }

  async getProductionOrder(id: string): Promise<ProductionOrder | null> {
    const p = this.productionOrders.get(id);
    return p ? structuredClone(p) : null;
  }

  async findProductionOrderBySku(sku: string): Promise<ProductionOrder | null> {
    const found = [...this.productionOrders.values()].find((p) => p.sku === sku);
    return found ? structuredClone(found) : null;
  }

  async getInventoryRecordBySku(sku: string): Promise<InventoryRecord | null> {
    const i = this.inventoryBySku.get(sku);
    return i ? structuredClone(i) : null;
  }

  async updateInventoryRecordBySku(sku: string, patch: Partial<InventoryRecord>): Promise<InventoryRecord> {
    const existing = this.inventoryBySku.get(sku);
    if (!existing) throw new Error(`InventoryRecord for sku ${sku} not found`);
    const updated = { ...existing, ...patch };
    this.inventoryBySku.set(sku, updated);
    return structuredClone(updated);
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
    const p = this.purchaseOrders.get(id);
    return p ? structuredClone(p) : null;
  }

  async listPurchaseOrdersByCase(caseId: string): Promise<PurchaseOrder[]> {
    return [...this.purchaseOrders.values()].filter((p) => p.caseId === caseId).map((p) => structuredClone(p));
  }

  async listAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    return [...this.purchaseOrders.values()].map((p) => structuredClone(p));
  }

  async createPurchaseOrder(po: PurchaseOrder): Promise<PurchaseOrder> {
    this.purchaseOrders.set(po.id, structuredClone(po));
    return structuredClone(po);
  }

  async updatePurchaseOrder(id: string, patch: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const existing = this.purchaseOrders.get(id);
    if (!existing) throw new Error(`PurchaseOrder ${id} not found`);
    const updated = { ...existing, ...patch };
    this.purchaseOrders.set(id, updated);
    return structuredClone(updated);
  }

  async getSupplier(id: string): Promise<Supplier | null> {
    const s = this.suppliers.get(id);
    return s ? structuredClone(s) : null;
  }

  async listSuppliers(): Promise<Supplier[]> {
    return [...this.suppliers.values()].map((s) => structuredClone(s));
  }

  async updateSupplier(id: string, patch: Partial<Supplier>): Promise<Supplier> {
    const existing = this.suppliers.get(id);
    if (!existing) throw new Error(`Supplier ${id} not found`);
    const updated = { ...existing, ...patch };
    this.suppliers.set(id, updated);
    return structuredClone(updated);
  }

  async createSupplierMessage(msg: SupplierMessage): Promise<void> {
    this.supplierMessages.push(structuredClone(msg));
  }

  async listSupplierMessagesByCase(caseId: string): Promise<SupplierMessage[]> {
    return this.supplierMessages.filter((m) => m.caseId === caseId).map((m) => structuredClone(m));
  }

  async createRfq(rfq: RFQ): Promise<void> {
    this.rfqs.set(rfq.id, structuredClone(rfq));
  }

  async listRfqsByCase(caseId: string): Promise<RFQ[]> {
    return [...this.rfqs.values()].filter((r) => r.caseId === caseId).map((r) => structuredClone(r));
  }

  async updateRfq(id: string, patch: Partial<RFQ>): Promise<RFQ> {
    const existing = this.rfqs.get(id);
    if (!existing) throw new Error(`RFQ ${id} not found`);
    const updated = { ...existing, ...patch };
    this.rfqs.set(id, updated);
    return structuredClone(updated);
  }

  async getEmergencyBudget(): Promise<EmergencyBudget> {
    return structuredClone(this.emergencyBudget);
  }

  async updateEmergencyBudget(patch: Partial<EmergencyBudget>): Promise<EmergencyBudget> {
    this.emergencyBudget = {
      ...this.emergencyBudget,
      ...patch,
      updatedAt: new Date().toISOString()
    };
    this.emergencyBudget.remainingAmount =
      this.emergencyBudget.totalAmount -
      this.emergencyBudget.reservedAmount -
      this.emergencyBudget.spentAmount;
    return structuredClone(this.emergencyBudget);
  }

  async createRecoveryPlanVersion(v: RecoveryPlanVersion & { id: string }): Promise<void> {
    this.planVersions = this.planVersions.map((existing) =>
      existing.caseId === v.caseId && existing.status === "ACTIVE"
        ? { ...existing, status: "SUPERSEDED" as const }
        : existing
    );
    this.planVersions.push(structuredClone(v));
  }

  async getActivePlanVersion(caseId: string): Promise<(RecoveryPlanVersion & { id: string }) | null> {
    const found = this.planVersions.find((v) => v.caseId === caseId && v.status === "ACTIVE");
    return found ? structuredClone(found) : null;
  }

  async listPlanVersions(caseId: string): Promise<(RecoveryPlanVersion & { id: string })[]> {
    return this.planVersions.filter((v) => v.caseId === caseId).map((v) => structuredClone(v));
  }

  async createValidationResult(result: ValidationResult & { id: string }): Promise<void> {
    this.validationResults.push(structuredClone(result));
  }

  async getLatestValidationResult(planVersionId: string): Promise<ValidationResult | null> {
    const matches = this.validationResults.filter((r) => r.planVersionId === planVersionId);
    return matches.length > 0 ? structuredClone(matches[matches.length - 1]) : null;
  }

  async createApprovalRequest(req: ApprovalRequest): Promise<ApprovalRequest> {
    this.approvalRequests.set(req.id, structuredClone(req));
    return structuredClone(req);
  }

  async getApprovalRequest(id: string): Promise<ApprovalRequest | null> {
    const r = this.approvalRequests.get(id);
    return r ? structuredClone(r) : null;
  }

  async updateApprovalRequest(id: string, patch: Partial<ApprovalRequest>): Promise<ApprovalRequest> {
    const existing = this.approvalRequests.get(id);
    if (!existing) throw new Error(`ApprovalRequest ${id} not found`);
    const updated = { ...existing, ...patch };
    this.approvalRequests.set(id, updated);
    return structuredClone(updated);
  }

  async getPendingApprovalForCase(caseId: string): Promise<ApprovalRequest | null> {
    const found = [...this.approvalRequests.values()].find(
      (r) => r.caseId === caseId && r.status === "PENDING"
    );
    return found ? structuredClone(found) : null;
  }

  async appendAuditEvent(event: AuditEvent): Promise<void> {
    this.auditEvents.push(structuredClone(event));
  }

  async listAuditEvents(caseId: string): Promise<AuditEvent[]> {
    return this.auditEvents.filter((e) => e.caseId === caseId).map((e) => structuredClone(e));
  }

  async listAllAuditEvents(): Promise<AuditEvent[]> {
    return this.auditEvents.map((e) => structuredClone(e));
  }
}
