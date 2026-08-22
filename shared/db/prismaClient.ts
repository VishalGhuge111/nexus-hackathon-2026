import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __nexusPrisma: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
  if (!global.__nexusPrisma) {
    global.__nexusPrisma = new PrismaClient();
  }
  return global.__nexusPrisma;
}
