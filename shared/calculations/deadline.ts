// PRD §19 — deadline_risk (production_deadline_slack).
import { daysBetween } from "./constants";

export interface DeadlineSlackInput {
  deadlineDate: Date;
  today: Date;
  estimatedLeadTimeDays: number | null | undefined;
  supplierDefaultLeadTimeDays?: number | null;
}

export type DeadlineSlackResult =
  | { status: "OK"; slackDays: number; breach: boolean }
  | { status: "NO_DATA" };

export function deadlineSlack(input: DeadlineSlackInput): DeadlineSlackResult {
  const leadTimeDays = input.estimatedLeadTimeDays ?? input.supplierDefaultLeadTimeDays;
  if (leadTimeDays === null || leadTimeDays === undefined) {
    return { status: "NO_DATA" };
  }
  const daysUntilDeadline = daysBetween(input.today, input.deadlineDate);
  const slackDays = daysUntilDeadline - leadTimeDays;
  return { status: "OK", slackDays, breach: slackDays < 0 };
}
