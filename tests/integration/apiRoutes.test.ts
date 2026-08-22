import { describe, it, expect, beforeEach } from "vitest";
import { POST as handleEvent } from "../../web/src/app/api/agent/event/route";
import { POST as handleTick } from "../../web/src/app/api/agent/tick/route";
import { GET as handleGetCase } from "../../web/src/app/api/cases/[id]/route";
import { GET as handleGetDashboard } from "../../web/src/app/api/dashboard/summary/route";
import { POST as handleResolveApproval } from "../../web/src/app/api/approvals/[id]/resolve/route";
import { resetStoreForTests } from "@nexus/shared/db/factory";
import { MemoryStore } from "@nexus/shared/db/memoryStore";
import { buildDemoFixture, ORIGINAL_PO_ID } from "@nexus/shared/db/demoSeed";

describe("PRD §27 — API Route Integration Tests", () => {
  beforeEach(() => {
    // Every test below drives the real route handlers through a brand-new
    // Case (each independently triggers its own SHIPMENT_DELAY). Passing
    // `undefined` here only clears getStore()'s cached singleton reference —
    // it does NOT guarantee a fresh store: whenever DATABASE_URL is set (e.g.
    // a local dev environment with Neon configured), the very next getStore()
    // call inside the route handler immediately recreates a PrismaStore
    // pointed at the same persistent rows as every other test in this file,
    // so a later test's "fresh" event silently reuses whatever case an
    // earlier test already advanced. Passing an actual fresh, seeded
    // MemoryStore makes every test deterministic regardless of the runtime
    // environment's DATABASE_URL — matching what "reset...before each test"
    // was always meant to guarantee.
    const fixture = buildDemoFixture(new Date());
    resetStoreForTests(
      new MemoryStore({
        productionOrders: [fixture.productionOrder],
        inventoryRecords: [fixture.inventoryRecord],
        suppliers: fixture.suppliers,
        purchaseOrders: fixture.purchaseOrders,
        emergencyBudget: fixture.emergencyBudget
      })
    );
  });

  describe("POST /api/agent/event", () => {
    it("returns 400 when body is invalid or missing disruption type", async () => {
      const req = new Request("http://localhost:3000/api/agent/event", {
        method: "POST",
        body: JSON.stringify({})
      });
      const res = await handleEvent(req);
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toContain("disruption event type");
    });

    it("returns 400 when SHIPMENT_DELAY is missing payload.poId", async () => {
      const req = new Request("http://localhost:3000/api/agent/event", {
        method: "POST",
        body: JSON.stringify({ type: "SHIPMENT_DELAY", payload: {} })
      });
      const res = await handleEvent(req);
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toContain("payload.poId is required");
    });

    it("returns 501 for unhandled event types", async () => {
      const req = new Request("http://localhost:3000/api/agent/event", {
        method: "POST",
        body: JSON.stringify({ type: "UNSUPPORTED_DISRUPTION" })
      });
      const res = await handleEvent(req);
      expect(res.status).toBe(501);
    });

    it("ingests valid SHIPMENT_DELAY event and runs first tick successfully", async () => {
      const req = new Request("http://localhost:3000/api/agent/event", {
        method: "POST",
        body: JSON.stringify({
          type: "SHIPMENT_DELAY",
          payload: { poId: ORIGINAL_PO_ID, delayHours: 24 }
        })
      });
      const res = await handleEvent(req);
      expect(res.status).toBe(200);
      const json = (await res.json()) as { caseId: string; case: { status: string } };
      expect(json.caseId).toBeDefined();
      expect(json.case).toBeDefined();
      expect(json.case.status).toBe("VERIFY"); // Tick 1 advances EARLY_RISK_CHECK -> VERIFY
    });
  });

  describe("POST /api/agent/tick", () => {
    it("advances active in-progress cases and returns results summary", async () => {
      // Ingest an event first (advances EARLY_RISK_CHECK -> VERIFY)
      const eventReq = new Request("http://localhost:3000/api/agent/event", {
        method: "POST",
        body: JSON.stringify({
          type: "SHIPMENT_DELAY",
          payload: { poId: ORIGINAL_PO_ID, delayHours: 24 }
        })
      });
      await handleEvent(eventReq);

      // handleTick runs tick 2 (advances VERIFY -> PLAN)
      const res = await handleTick();
      expect(res.status).toBe(200);
      const json = (await res.json()) as { advanced: number; results: { status: string }[] };
      expect(json.advanced).toBeGreaterThanOrEqual(1);
      expect(json.results[0].status).toBe("PLAN");
    });
  });

  describe("GET /api/cases/[id]", () => {
    it("returns 404 when case does not exist", async () => {
      const req = new Request("http://localhost:3000/api/cases/non-existent-id");
      const res = await handleGetCase(req, { params: Promise.resolve({ id: "non-existent-id" }) });
      expect(res.status).toBe(404);
      const json = (await res.json()) as { error: string };
      expect(json.error).toContain("not found");
    });

    it("returns full composite Case details and DoNothing vs NEXUS comparison", async () => {
      const eventReq = new Request("http://localhost:3000/api/agent/event", {
        method: "POST",
        body: JSON.stringify({
          type: "SHIPMENT_DELAY",
          payload: { poId: ORIGINAL_PO_ID, delayHours: 24 }
        })
      });
      const eventRes = await handleEvent(eventReq);
      const eventJson = (await eventRes.json()) as { caseId: string };
      const caseId = eventJson.caseId;

      const req = new Request(`http://localhost:3000/api/cases/${caseId}`);
      const res = await handleGetCase(req, { params: Promise.resolve({ id: caseId }) });
      expect(res.status).toBe(200);

      const json = (await res.json()) as {
        case: { id: string };
        agentState: unknown;
        productionOrder: unknown;
        inventory: unknown;
        auditEvents: unknown[];
        doNothingVsNexus: { doNothing: unknown; nexusPlan: unknown };
      };
      expect(json.case.id).toBe(caseId);
      expect(json.agentState).toBeDefined();
      expect(json.productionOrder).toBeDefined();
      expect(json.inventory).toBeDefined();
      expect(json.auditEvents).toBeDefined();
      expect(json.doNothingVsNexus).toBeDefined();
      expect(json.doNothingVsNexus.doNothing).toBeDefined();
      expect(json.doNothingVsNexus.nexusPlan).toBeDefined();
    });
  });

  describe("GET /api/dashboard/summary", () => {
    it("returns summary KPIs and list of sorted active cases", async () => {
      const res = await handleGetDashboard();
      expect(res.status).toBe(200);

      const json = (await res.json()) as {
        kpis: {
          ordersAtRiskCount: number;
          unitsAtRisk: number;
          emergencyBudgetRemaining: number;
        };
        cases: unknown[];
      };
      expect(json.kpis).toBeDefined();
      expect(typeof json.kpis.ordersAtRiskCount).toBe("number");
      expect(typeof json.kpis.unitsAtRisk).toBe("number");
      expect(typeof json.kpis.emergencyBudgetRemaining).toBe("number");
      expect(Array.isArray(json.cases)).toBe(true);
    });
  });

  describe("POST /api/approvals/[id]/resolve", () => {
    it("returns 400 for invalid decision values", async () => {
      const req = new Request("http://localhost:3000/api/approvals/app-1/resolve", {
        method: "POST",
        body: JSON.stringify({ decision: "INVALID_DECISION" })
      });
      const res = await handleResolveApproval(req, { params: Promise.resolve({ id: "app-1" }) });
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toContain("must be APPROVED or REJECTED");
    });

    it("returns 400 when approval request does not exist", async () => {
      const req = new Request("http://localhost:3000/api/approvals/non-existent-app/resolve", {
        method: "POST",
        body: JSON.stringify({ decision: "APPROVED", resolvedBy: "ops" })
      });
      const res = await handleResolveApproval(req, { params: Promise.resolve({ id: "non-existent-app" }) });
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toContain("not found");
    });
  });
});
