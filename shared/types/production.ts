export interface ProductionOrder {
	id: string;
	sku: string;
	plannedQty: number;
	bomQtyPerUnit: number;
	deadlineDate: string;
	priority: 'STANDARD' | 'CRITICAL';
	status: string;
}
