// Deterministic, hydration-safe formatting helpers. All display data here comes
// from a fixed demo fixture that's evaluated once on the server and once on the
// client — `toLocaleTimeString()`/`toDateString()` with no explicit timezone, or
// `.toLocaleString()` with no explicit locale, can render differently on each
// side and trigger a React hydration mismatch. These helpers never depend on
// the runtime's locale or timezone.

/** "2026-08-27T09:00:00.000Z" -> "2026-08-27" */
export function formatDateUTC(iso: string): string {
  return iso.slice(0, 10);
}

/** "2026-08-22T09:19:00.000Z" -> "09:19" (UTC) */
export function formatTimeUTC(iso: string): string {
  return iso.slice(11, 16);
}

/** Explicit locale (not the environment default) keeps output identical on server and client. */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Display-only rounding for RiskSignal.value/threshold. Live values are real
 * floating-point results (e.g. a deadline-slack computation landing on
 * -3.47e-8 instead of exactly 0) — toFixed keeps the UI readable without
 * touching the underlying calculation. Normalizes "-0.00" (tiny negative
 * floats rounding through zero) to "0.00" so near-zero results don't display
 * a misleading negative sign.
 */
export function formatSignalValue(value: number): string {
  const fixed = value.toFixed(2);
  return fixed === "-0.00" ? "0.00" : fixed;
}
