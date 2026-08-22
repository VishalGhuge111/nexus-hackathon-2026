// PRD §16 — Deterministic Validator input contracts.

export interface ValidatorSupplierContext {
  supplierId: string;
  certifications: string[];
  moq: number;
  maxCapacityPerCycle: number;
  reliabilityScore: number;
  qualityScore: number;
}

export interface ValidatorAllocation {
  supplierId: string;
  qty: number;
  unitPrice: number;
  expediteFee?: number;
  shippingCost?: number;
  expectedArrivalDate: Date;
  isOriginalSupplierPartial?: boolean;
}

export interface ValidatorScheduleAdjustment {
  productionOrderId: string;
  originalDeadline: Date;
  newDeadline: Date;
}

export interface ValidatorPlanInput {
  planVersionId: string;
  caseId: string;
  totalCost: number;
  requiredQty: number;
  allocations: ValidatorAllocation[];
  scheduleAdjustments?: ValidatorScheduleAdjustment[];
}

export interface ValidatorContext {
  today: Date;
  usableStock: number;
  dailyUsageRate: number;
  safetyStockThreshold: number;
  productionRequirement: number;
  deadlineDate: Date;
  emergencyBudgetRemaining: number;
  approvalThreshold: number;
  requiredCertifications: string[];
  suppliers: Record<string, ValidatorSupplierContext>;
  currentCycle: number;
  inventoryReadCycle: number;
  eligibilityCheckedCycle: Record<string, number>;
}
