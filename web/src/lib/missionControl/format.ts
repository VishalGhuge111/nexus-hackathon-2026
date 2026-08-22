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
