export interface InventoryRecord {
	sku: string;
	warehouseId: string;
	currentStock: number;
	usableStock: number;
	dailyUsageRate: number;
	safetyStockThreshold: number;
	lastUpdatedAt: string;
	stockDiscrepancyFlag?: boolean;
}
