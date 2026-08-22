export interface PurchaseOrder {
	id: string; supplierId: string; sku: string; qty: number; unitPrice: number;
	status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'DELAYED' | 'FULFILLED' | 'CANCELLED';
	expectedDeliveryDate: string; caseId?: string;
}

export interface RfqResponse {
	supplierId: string; price: number; leadTimeDays: number; capacityOffered: number;
	expediteAvailable?: boolean; expediteFee?: number; quoteValidHours: number;
	quoteReceivedAt: string;
}

export interface RFQ {
	id: string; caseId: string; sku: string; qty: number; neededBy: string;
	supplierIds: string[]; status: 'OPEN' | 'CLOSED'; responses: RfqResponse[];
}

export interface RecoveryPlan {
	id: string; caseId: string; versionId: string;
	allocations: {
		supplierId: string; qty: number; unitPrice: number; expediteFee?: number;
		isOriginalSupplierPartial?: boolean;
	}[];
	totalCost: number; expectedDeliveryDate: string;
	scheduleAdjustments?: {
		productionOrderId: string; action: 'DELAY'; originalDeadline: string;
		newDeadline: string; justification: string;
	}[];
}

export interface EmergencyBudget {
	totalAmount: number; reservedAmount: number; spentAmount: number;
	remainingAmount: number; updatedAt: string;
}

export interface RecoveryPlanVersion {
	version: number; caseId: string; parent_version: number | null;
	plan: RecoveryPlan; invalidated_assumptions: string[];
	carried_forward_actions: string[]; reason_for_change: string;
	triggering_event: string; status: 'ACTIVE' | 'SUPERSEDED'; createdAt: string;
}
// EmergencyBudget, and ApprovalRequest interfaces from Section 26.
