// Locked numeric policy constants from PRD.md. Central so no magic numbers drift
// between the validator, eligibility checks, and the FSM.

// §13a. Raised from the original 12 to 16 when handlePlan started dispatching a
// real rfq_request call (shared/tools/primitives.ts) for genuine supplier quote
// comparison (PS §4.6/5.7) — the golden path's V1-fail->V2-replan->execute
// sequence alone already used up to 12 calls before that tool existed, leaving
// no headroom for a real added capability without this increase.
export const MAX_TOOL_CALLS_PER_CASE = 16; // §13a
export const MAX_REPLANS = 3; // §24
export const MAX_UNVERIFIABLE_CYCLES = 3; // §12 / §15 NO_DATA cap
export const MAX_REPROPOSALS_PER_PLAN_CYCLE = 2; // §15
export const DEFAULT_LEAD_TIME_BUFFER_DAYS = 2; // §11 production_deadline_slack breach
export const DEFAULT_MIN_RELIABILITY_FOR_CASE = 0.5; // §17
export const TIGHT_DEADLINE_MIN_RELIABILITY_FOR_CASE = 0.7; // §17
export const DEFAULT_MIN_QUALITY_FOR_CASE = 0.7; // §17
export const DEFAULT_APPROVAL_THRESHOLD = 150000; // §21 session default fallback
export const MAX_SPLIT_ALLOCATIONS = 3; // §18

export const EARLY_WARNING_THRESHOLDS = {
  coverageDaysBreach: 5,
  safetyStockRatioBreach: 1.0,
  supplierResponseLatencyHoursBreach: 24,
  shipmentTrackingInactivityHoursBreach: 18,
  supplierReliabilityScoreBreach: 0.6
} as const;

export const TRUST_ORDER = ["tracking", "erp", "supplierMessage"] as const; // §15
