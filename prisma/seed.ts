// Seeds the real Neon/Postgres database with the same fixture the in-memory
// dev store uses (shared/db/demoSeed.ts) — one source of truth for demo data.
// Run with: DATABASE_URL=... npx tsx prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { buildDemoFixture } from "../shared/db/demoSeed";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const fixture = buildDemoFixture(new Date());

  await prisma.productionOrder.upsert({
    where: { id: fixture.productionOrder.id },
    create: {
      id: fixture.productionOrder.id,
      sku: fixture.productionOrder.sku,
      plannedQty: fixture.productionOrder.plannedQty,
      bomQtyPerUnit: fixture.productionOrder.bomQtyPerUnit,
      deadlineDate: new Date(fixture.productionOrder.deadlineDate),
      priority: fixture.productionOrder.priority,
      status: fixture.productionOrder.status
    },
    update: {}
  });

  await prisma.inventoryRecord.upsert({
    where: { id: `${fixture.inventoryRecord.sku}-${fixture.inventoryRecord.warehouseId}` },
    create: {
      id: `${fixture.inventoryRecord.sku}-${fixture.inventoryRecord.warehouseId}`,
      sku: fixture.inventoryRecord.sku,
      warehouseId: fixture.inventoryRecord.warehouseId,
      currentStock: fixture.inventoryRecord.currentStock,
      usableStock: fixture.inventoryRecord.usableStock,
      dailyUsageRate: fixture.inventoryRecord.dailyUsageRate,
      safetyStockThreshold: fixture.inventoryRecord.safetyStockThreshold,
      lastUpdatedAt: new Date(fixture.inventoryRecord.lastUpdatedAt),
      stockDiscrepancyFlag: fixture.inventoryRecord.stockDiscrepancyFlag ?? false
    },
    update: {}
  });

  for (const supplier of fixture.suppliers) {
    await prisma.supplier.upsert({
      where: { id: supplier.id },
      create: {
        id: supplier.id,
        name: supplier.name,
        certifications: supplier.certifications,
        moq: supplier.moq,
        maxCapacityPerCycle: supplier.maxCapacityPerCycle,
        defaultLeadTimeDays: supplier.defaultLeadTimeDays,
        reliabilityScore: supplier.reliabilityScore,
        qualityScore: supplier.qualityScore,
        pricePerUnit: supplier.pricePerUnit,
        contactEmail: supplier.contactEmail ?? null
      },
      // Backfills contactEmail (added for PS §5.5/5.6 supplier communication)
      // onto rows seeded before this field existed, without touching anything
      // a live demo run may since have changed on the other fields.
      update: {
        contactEmail: supplier.contactEmail ?? null
      }
    });
  }

  for (const po of fixture.purchaseOrders) {
    await prisma.purchaseOrder.upsert({
      where: { id: po.id },
      create: {
        id: po.id,
        supplierId: po.supplierId,
        sku: po.sku,
        qty: po.qty,
        unitPrice: po.unitPrice,
        status: po.status,
        expectedDeliveryDate: new Date(po.expectedDeliveryDate),
        caseId: po.caseId ?? null
      },
      update: {}
    });
  }

  await prisma.emergencyBudget.upsert({
    where: { id: "EMERGENCY_BUDGET_SINGLETON" },
    create: {
      id: "EMERGENCY_BUDGET_SINGLETON",
      totalAmount: fixture.emergencyBudget.totalAmount,
      reservedAmount: fixture.emergencyBudget.reservedAmount,
      spentAmount: fixture.emergencyBudget.spentAmount,
      remainingAmount: fixture.emergencyBudget.remainingAmount,
      updatedAt: new Date(fixture.emergencyBudget.updatedAt)
    },
    update: {}
  });

  console.log("Seed complete:", {
    productionOrder: fixture.productionOrder.id,
    suppliers: fixture.suppliers.map((s) => s.id),
    purchaseOrders: fixture.purchaseOrders.map((p) => p.id)
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
