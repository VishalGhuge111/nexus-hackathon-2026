// Data-access boundary. Both the in-memory dev store and the Prisma/Neon store
// implement this same interface so agent/FSM logic never knows which backs it.
import type { Case, RiskSignal } from "../types/case";
import type { AgentState } from "../types/agent";
import type { ProductionOrder } from "../types/production";
import type { InventoryRecord } from "../types/inventory";
import type { Supplier } from "../types/supplier";
import type {
  PurchaseOrder,
  RecoveryPlanVersion,
  EmergencyBudget
} from "../types/procurement";
import type { ValidationResult, ApprovalRequest } from "../types/validation";
import type { AuditEvent } from "../types/audit";

export interface Store {
  getCase(id: string): Promise<Case | null>;
  listActiveCases(): Promise<Case[]>;
  findCaseByProductionOrder(productionOrderId: string): Promise<Case | null>;
  createCase(input: Case): Promise<Case>;
  updateCase(id: string, patch: Partial<Case>): Promise<Case>;
  addRiskSignal(caseId: string, signal: RiskSignal): Promise<void>;

  getAgentState(caseId: string): Promise<AgentState | null>;
  upsertAgentState(state: AgentState): Promise<AgentState>;

  getProductionOrder(id: string): Promise<ProductionOrder | null>;
  findProductionOrderBySku(sku: string): Promise<ProductionOrder | null>;

  getInventoryRecordBySku(sku: string): Promise<InventoryRecord | null>;

  getPurchaseOrder(id: string): Promise<PurchaseOrder | null>;
  listPurchaseOrdersByCase(caseId: string): Promise<PurchaseOrder[]>;
  createPurchaseOrder(po: PurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: string, patch: Partial<PurchaseOrder>): Promise<PurchaseOrder>;

  getSupplier(id: string): Promise<Supplier | null>;
  listSuppliers(): Promise<Supplier[]>;

  getEmergencyBudget(): Promise<EmergencyBudget>;
  updateEmergencyBudget(patch: Partial<EmergencyBudget>): Promise<EmergencyBudget>;

  createRecoveryPlanVersion(v: RecoveryPlanVersion & { id: string }): Promise<void>;
  getActivePlanVersion(caseId: string): Promise<(RecoveryPlanVersion & { id: string }) | null>;
  listPlanVersions(caseId: string): Promise<(RecoveryPlanVersion & { id: string })[]>;

  createValidationResult(result: ValidationResult & { id: string }): Promise<void>;
  getLatestValidationResult(planVersionId: string): Promise<ValidationResult | null>;

  createApprovalRequest(req: ApprovalRequest): Promise<ApprovalRequest>;
  getApprovalRequest(id: string): Promise<ApprovalRequest | null>;
  updateApprovalRequest(id: string, patch: Partial<ApprovalRequest>): Promise<ApprovalRequest>;
  getPendingApprovalForCase(caseId: string): Promise<ApprovalRequest | null>;

  appendAuditEvent(event: AuditEvent): Promise<void>;
  listAuditEvents(caseId: string): Promise<AuditEvent[]>;
}
