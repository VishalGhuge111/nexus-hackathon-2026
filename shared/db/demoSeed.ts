// Single source of truth for the demo fixture data, used by both the in-memory
// store (local runs without credentials) and prisma/seed.ts (real Neon DB).
// Models the PRD's own recommended minimum-viable-demo scenario (§"Brutally Honest
// Feasibility Assessment"): Shipment Delay 24h, simplest formula chain.
import type { ProductionOrder } from "../types/production";
import type { InventoryRecord } from "../types/inventory";
import type { Supplier } from "../types/supplier";
import type { PurchaseOrder, EmergencyBudget } from "../types/procurement";

export const SKU = "COMP-ALPHA";
export const PRODUCTION_ORDER_ID = "prod-914";
export const ORIGINAL_SUPPLIER_ID = "supplier-orbital";
export const ALTERNATE_SUPPLIER_ID = "supplier-veloce";
export const ORIGINAL_PO_ID = "po-1001";

export interface DemoFixture {
  productionOrder: ProductionOrder;
  inventoryRecord: InventoryRecord;
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  emergencyBudget: EmergencyBudget;
}

export function buildDemoFixture(now: Date = new Date()): DemoFixture {
  const iso = (daysFromNow: number) =>
    new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();

  return {
    productionOrder: {
      id: PRODUCTION_ORDER_ID,
      sku: SKU,
      plannedQty: 450,
      bomQtyPerUnit: 2, // production_requirement = 900
      deadlineDate: iso(5),
      priority: "CRITICAL",
      status: "IN_PROGRESS"
    },
    inventoryRecord: {
      sku: SKU,
      warehouseId: "WH-1",
      currentStock: 800, // ERP-reported (PRD §19 worked example)
      usableStock: 390, // warehouse-confirmed ground truth (PRD §19 worked example)
      dailyUsageRate: 90,
      safetyStockThreshold: 150,
      lastUpdatedAt: now.toISOString(),
      stockDiscrepancyFlag: true
    },
    suppliers: [
      {
        id: ORIGINAL_SUPPLIER_ID,
        name: "Orbital Components Ltd",
        certifications: ["ISO9001"],
        moq: 100,
        maxCapacityPerCycle: 1000,
        defaultLeadTimeDays: 5,
        reliabilityScore: 0.85,
        qualityScore: 0.8,
        pricePerUnit: { [SKU]: 150 }
      },
      {
        id: ALTERNATE_SUPPLIER_ID,
        name: "Veloce Parts Co",
        certifications: ["ISO9001"],
        moq: 50,
        maxCapacityPerCycle: 800,
        defaultLeadTimeDays: 2,
        reliabilityScore: 0.78,
        qualityScore: 0.82,
        pricePerUnit: { [SKU]: 166.67 }
      }
    ],
    purchaseOrders: [
      {
        // Arrives 12h before the deadline pre-disruption; a 24h SHIPMENT_DELAY event
        // (§31) pushes it 12h past the deadline, producing a genuine, unambiguous miss.
        id: ORIGINAL_PO_ID,
        supplierId: ORIGINAL_SUPPLIER_ID,
        sku: SKU,
        qty: 600,
        unitPrice: 150,
        status: "CONFIRMED",
        expectedDeliveryDate: iso(4.5)
      }
    ],
    emergencyBudget: {
      totalAmount: 500000,
      reservedAmount: 0,
      spentAmount: 0,
      remainingAmount: 500000,
      updatedAt: now.toISOString()
    }
  };
}
