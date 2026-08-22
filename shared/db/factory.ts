import type { Store } from "./types";
import { MemoryStore } from "./memoryStore";
import { buildDemoFixture } from "./demoSeed";
import { getPrismaClient } from "./prismaClient";
import { PrismaStore } from "./prismaStore";

declare global {
  // eslint-disable-next-line no-var
  var __nexusStore: Store | undefined;
}

/**
 * Returns the process-wide Store. Uses the real Prisma/Neon store when
 * DATABASE_URL is configured; otherwise falls back to an in-memory store
 * pre-loaded with the demo fixture, so the full agent loop is runnable
 * locally with zero external credentials (see PRD.md 19-hour plan: agent
 * wired with stub dependencies first, real backends later).
 */
export function getStore(): Store {
  if (global.__nexusStore) return global.__nexusStore;

  if (process.env.DATABASE_URL) {
    global.__nexusStore = new PrismaStore(getPrismaClient());
  } else {
    const fixture = buildDemoFixture(new Date());
    global.__nexusStore = new MemoryStore({
      productionOrders: [fixture.productionOrder],
      inventoryRecords: [fixture.inventoryRecord],
      suppliers: fixture.suppliers,
      purchaseOrders: fixture.purchaseOrders,
      emergencyBudget: fixture.emergencyBudget
    });
  }
  return global.__nexusStore;
}

export function resetStoreForTests(store?: Store): void {
  global.__nexusStore = store;
}
