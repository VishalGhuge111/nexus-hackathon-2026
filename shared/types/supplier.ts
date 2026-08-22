export interface Supplier {
	id: string;
	name: string;
	certifications: string[];
	moq: number;
	maxCapacityPerCycle: number;
	defaultLeadTimeDays: number;
	reliabilityScore: number;
	qualityScore: number;
	pricePerUnit: Record<string, number>;
	/** §17 eligibility input — set by a verified tracking/supplier-claim mismatch (see SUPPLIER_CLAIM_CONTRADICTION event). Defaults to false/undefined for every seeded supplier. */
	hasOpenContradiction?: boolean;
}

export interface SupplierMessage {
	id: string;
	supplierId: string;
	caseId: string;
	direction: 'OUTBOUND' | 'INBOUND';
	subject: string;
	body: string;
	extractedFields?: Record<string, unknown>;
	contradictionFlag?: boolean;
	sentAt: string;
}
