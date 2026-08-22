import { describe, it, expect } from "vitest";
import { deadlineSlack } from "@nexus/shared/calculations";

describe("deadlineSlack", () => {
  it("computes slack = daysUntilDeadline - leadTime (safe)", () => {
    // PRD §19 example: deadline in 10 days, lead time 6 -> slack = 4
    const today = new Date("2026-08-22T00:00:00Z");
    const deadline = new Date("2026-09-01T00:00:00Z");
    const result = deadlineSlack({ deadlineDate: deadline, today, estimatedLeadTimeDays: 6 });
    expect(result).toMatchObject({ status: "OK", slackDays: 4, breach: false });
  });

  it("flags breach when lead time exceeds days remaining", () => {
    // PRD §19 example: lead time 12 -> slack = -2 (breach)
    const today = new Date("2026-08-22T00:00:00Z");
    const deadline = new Date("2026-09-01T00:00:00Z");
    const result = deadlineSlack({ deadlineDate: deadline, today, estimatedLeadTimeDays: 12 });
    expect(result).toMatchObject({ status: "OK", slackDays: -2, breach: true });
  });

  it("falls back to supplier default lead time, else NO_DATA", () => {
    const today = new Date("2026-08-22T00:00:00Z");
    const deadline = new Date("2026-09-01T00:00:00Z");
    const withDefault = deadlineSlack({
      deadlineDate: deadline,
      today,
      estimatedLeadTimeDays: null,
      supplierDefaultLeadTimeDays: 5
    });
    expect(withDefault).toMatchObject({ status: "OK", slackDays: 5 });

    const noData = deadlineSlack({
      deadlineDate: deadline,
      today,
      estimatedLeadTimeDays: null,
      supplierDefaultLeadTimeDays: null
    });
    expect(noData).toEqual({ status: "NO_DATA" });
  });
});
