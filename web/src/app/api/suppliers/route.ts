// GET /api/suppliers — the full real Supplier roster (shared/types/supplier.ts),
// unfiltered. No case-specific eligibility is computed here: eligibility is only
// meaningful against a concrete shortage/deadline (shared/supplier/eligibility.ts),
// so a case-agnostic listing shows the real underlying fields instead of a
// fabricated pass/fail.
import { getStore } from "@nexus/shared/db/factory";

export async function GET(): Promise<Response> {
  const store = getStore();
  const suppliers = await store.listSuppliers();
  return Response.json({ suppliers });
}
