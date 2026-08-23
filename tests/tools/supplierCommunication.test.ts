// PS §5.5/5.6 — supplier communication channel. Covers the email adapter in
// isolation (config validation, success/failure handling, never throwing) and
// the supplierMessageSendTool/supplierMessageReceiveTool primitives that wrap
// it (communication always recorded; email is never a single point of
// failure). The golden-path FSM integration itself is already covered by
// tests/integration/shipmentDelay.test.ts, which now also exercises this code
// path since it runs a real handlePlan cycle.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MemoryStore } from "@nexus/shared/db/memoryStore";
import {
  sendTransactionalEmail,
  isBrevoConfigured
} from "@nexus/shared/email/brevoClient";
import {
  supplierMessageSendTool,
  supplierMessageReceiveTool,
  buildQuoteInboundMessage
} from "@nexus/shared/tools/primitives";
import type { RfqResponse } from "@nexus/shared/types/procurement";
import type { Supplier } from "@nexus/shared/types/supplier";

const ORIGINAL_ENV = { ...process.env };

function resetEmailEnv(): void {
  delete process.env.BREVO_API_KEY;
  delete process.env.BREVO_SENDER_EMAIL;
  delete process.env.BREVO_SENDER_NAME;
  delete process.env.SUPPLIER_EMAIL_OVERRIDE;
}

describe("PS §5.5/5.6 — Brevo email adapter (shared/email/brevoClient.ts)", () => {
  beforeEach(() => {
    resetEmailEnv();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("reports NOT_CONFIGURED and never throws when BREVO_API_KEY/BREVO_SENDER_EMAIL are unset", async () => {
    expect(isBrevoConfigured()).toBe(false);
    const result = await sendTransactionalEmail({ to: "supplier@example.com", subject: "Test", htmlBody: "Body" });
    expect(result.status).toBe("NOT_CONFIGURED");
    expect(result.errorReason).toBeTruthy();
  });

  it("reports SENT and captures the provider message id on a successful API response", async () => {
    process.env.BREVO_API_KEY = "test-key";
    process.env.BREVO_SENDER_EMAIL = "nexus@example.com";
    expect(isBrevoConfigured()).toBe(true);

    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      json: async () => ({ messageId: "brevo-msg-1" })
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendTransactionalEmail({ to: "supplier@example.com", subject: "Test", htmlBody: "Body" });
    expect(result.status).toBe("SENT");
    expect(result.providerMessageId).toBe("brevo-msg-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1];
    expect((init?.headers as Record<string, string>)["api-key"]).toBe("test-key");
  });

  it("reports FAILED (never throws) when the provider returns a non-2xx response", async () => {
    process.env.BREVO_API_KEY = "test-key";
    process.env.BREVO_SENDER_EMAIL = "nexus@example.com";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 401, text: async () => "Unauthorized" }))
    );

    const result = await sendTransactionalEmail({ to: "supplier@example.com", subject: "Test", htmlBody: "Body" });
    expect(result.status).toBe("FAILED");
    expect(result.errorReason).toContain("401");
  });

  it("reports FAILED (never throws) when the network call itself rejects", async () => {
    process.env.BREVO_API_KEY = "test-key";
    process.env.BREVO_SENDER_EMAIL = "nexus@example.com";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNRESET");
      })
    );

    const result = await sendTransactionalEmail({ to: "supplier@example.com", subject: "Test", htmlBody: "Body" });
    expect(result.status).toBe("FAILED");
    expect(result.errorReason).toBe("ECONNRESET");
  });
});

describe("PS §5.5/5.6 — supplierMessageSendTool / supplierMessageReceiveTool", () => {
  let store: MemoryStore;
  const supplier: Supplier = {
    id: "supplier-test",
    name: "Test Supplier Co",
    certifications: ["ISO9001"],
    moq: 10,
    maxCapacityPerCycle: 1000,
    defaultLeadTimeDays: 3,
    reliabilityScore: 0.9,
    qualityScore: 0.9,
    pricePerUnit: { "SKU-1": 100 },
    contactEmail: "contact@testsupplier.example"
  };

  beforeEach(() => {
    resetEmailEnv();
    store = new MemoryStore({ suppliers: [supplier] });
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("records the outbound communication with emailStatus NOT_CONFIGURED when Brevo is unset, and still reports tool SUCCESS", async () => {
    const result = await supplierMessageSendTool(store, {
      caseId: "case-1",
      messages: [{ supplierId: supplier.id, subject: "Urgent RFQ", body: "Please quote 500 units." }]
    });

    expect(result.status).toBe("SUCCESS"); // communication recorded => tool succeeds regardless of email outcome
    expect(result.data?.[0].emailStatus).toBe("NOT_CONFIGURED");

    const messages = await store.listSupplierMessagesByCase("case-1");
    expect(messages).toHaveLength(1);
    expect(messages[0].direction).toBe("OUTBOUND");
    expect((messages[0].extractedFields as Record<string, unknown>).emailStatus).toBe("NOT_CONFIGURED");
  });

  it("records a COMMUNICATION_FAILED outcome without throwing when the provider call fails, and does not block the tool from succeeding", async () => {
    process.env.BREVO_API_KEY = "test-key";
    process.env.BREVO_SENDER_EMAIL = "nexus@example.com";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500, text: async () => "Internal error" }))
    );

    const result = await supplierMessageSendTool(store, {
      caseId: "case-1",
      messages: [{ supplierId: supplier.id, subject: "Urgent RFQ", body: "Please quote 500 units." }]
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.data?.[0].emailStatus).toBe("FAILED");
    expect(result.data?.[0].emailError).toContain("500");

    const messages = await store.listSupplierMessagesByCase("case-1");
    expect((messages[0].extractedFields as Record<string, unknown>).emailStatus).toBe("FAILED");
  });

  it("sends successfully and records the provider message id when Brevo is configured and healthy", async () => {
    process.env.BREVO_API_KEY = "test-key";
    process.env.BREVO_SENDER_EMAIL = "nexus@example.com";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ messageId: "brevo-msg-2" }) }))
    );

    const result = await supplierMessageSendTool(store, {
      caseId: "case-1",
      messages: [{ supplierId: supplier.id, subject: "Urgent RFQ", body: "Please quote 500 units." }]
    });

    expect(result.data?.[0].emailStatus).toBe("SENT");
    expect(result.data?.[0].to).toBe(supplier.contactEmail);
  });

  it("supplierMessageReceiveTool returns NO_DATA until an inbound quote message exists, then SUCCESS", async () => {
    const beforeResult = await supplierMessageReceiveTool(store, { caseId: "case-1", supplierIds: [supplier.id] });
    expect(beforeResult.status).toBe("NO_DATA");

    const response: RfqResponse = {
      supplierId: supplier.id,
      price: 166.67,
      leadTimeDays: 2,
      capacityOffered: 600,
      expediteAvailable: true,
      expediteFee: 33.33,
      quoteValidHours: 24,
      quoteReceivedAt: new Date().toISOString()
    };
    await store.createSupplierMessage(
      buildQuoteInboundMessage({ caseId: "case-1", sku: "SKU-1", response })
    );

    const afterResult = await supplierMessageReceiveTool(store, { caseId: "case-1", supplierIds: [supplier.id] });
    expect(afterResult.status).toBe("SUCCESS");
    expect(afterResult.data?.[0].direction).toBe("INBOUND");
    expect((afterResult.data?.[0].extractedFields as Record<string, unknown>).price).toBe(166.67);
  });
});
