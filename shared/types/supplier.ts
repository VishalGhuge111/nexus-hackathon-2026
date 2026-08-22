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
