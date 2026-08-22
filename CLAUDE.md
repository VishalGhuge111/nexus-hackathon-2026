# CLAUDE.md

Guidance for future Claude Code sessions working in this repository.

## What this repo is

NEXUS — an autonomous supply-continuity control agent. `PRD.md` (LOCKED-1.2) is
the single source of truth for architecture, data model, and behavior. Do not
contradict it; if a task conflicts with it, follow the PRD and report the
conflict rather than inventing a resolution.

Locked stack: Next.js (App Router) + TypeScript + Tailwind, PostgreSQL/Neon via
Prisma, Next.js API Routes, direct Claude API (Haiku + Sonnet), single agent
with an explicit FSM, deterministic TypeScript validator/calculations. See
`README.md` for how to run things locally.

## Repository layout

- `shared/` — deterministic core: `calculations/` (§19 formulas), `validator/`
  (§16, 8 checks), `supplier/` (§17 eligibility, §20 ranking), `db/` (Store
  interface + in-memory and Prisma implementations), `tools/` (§14 tool
  contracts + §13a budget-guarded dispatch), `llm/` (Claude client + local
  stand-in), `agent/` (§10 FSM, §31 events, §21 approval resolution),
  `types/` (all domain contracts — **never duplicate these in the UI**).
- `web/src/app/api/**` — the 5 real API routes (event/tick/cases/approvals/summary),
  wired to `shared/` and runnable against either an in-memory store or real
  Neon Postgres (see README).
- `web/src/app/page.tsx` + `web/src/components/mission-control/**` +
  `web/src/lib/missionControl/**` — the Mission Control frontend (see below).
- `tests/` — vitest suite for `shared/` (76 tests as of this writing).
- `prisma/` — schema + seed script.

## StubLlmClient: test vs. demo behavior

`shared/llm/stubClient.ts`'s `proposeRecoveryPlan` has two modes, selected by an
**opt-in** constructor option (default `false`):

- **Default** (`new StubLlmClient()`, or via `shared/llm/factory.ts` when
  `ANTHROPIC_API_KEY` is unset): always proposes a fully-covering first plan.
  This is what `tests/state-machine/fsmTransitions.test.ts` and other
  general-purpose FSM tests assume, and matches the stub's original design
  intent ("prove the FSM/Validator loop, not demonstrate LLM creativity").
- **`new StubLlmClient({ forceInitialUndershoot: true })`**: the first proposal
  (no rejection feedback yet) deliberately undershoots the shortage, so the
  caller can exercise a genuine `VALIDATE` failure → `ADAPT_REPLAN` → corrected
  V2 (PRD §23/Figure 3) instead of the plan passing on the first try. Only
  `tests/integration/shipmentDelay.test.ts` opts into this — it intentionally
  tests the V1-fails/V2-passes golden path.

**Known gap**: `shared/llm/factory.ts` (used by the live API routes /
Mission Control demo) still constructs `StubLlmClient()` with the default
(off). That means triggering the live "Shipment Delayed 24h" event through the
browser will currently show V1 passing immediately, not the V1→V2 replan
sequence — if the live demo needs to show the replan again, `factory.ts` needs
the same `{ forceInitialUndershoot: true }` option, which was deliberately
*not* added here (out of scope for the task that introduced this option; only
the named test call site was updated).

## Mission Control UI (current state)

**Status: presentation-only shell, NOT wired to the API routes yet.**

`web/src/app/page.tsx` renders entirely from a fixed, deterministic demo
fixture (`web/src/lib/missionControl/demoFixture.ts`). It does not call
`fetch()`, does not touch the database, and does not run the agent loop. This
was a deliberate scope decision for this task — the API routes and agent loop
already exist and work (see the integration commit on this branch) but are a
separate concern from building the presentation layer.

### File structure

```
web/src/lib/missionControl/
  demoFixture.ts   — the ONLY place with mock data. Computes every displayed
                     number by calling the REAL shared/calculations,
                     shared/validator, and shared/supplier functions (pure,
                     no I/O) against a small set of fixed inputs — so nothing
                     on screen is hand-typed, it's genuinely derived. All
                     dates are fixed ISO strings (never `new Date()` at module
                     scope) to avoid SSR/CSR hydration mismatches.
  format.ts        — deterministic (locale/timezone-independent) date and
                     currency formatting helpers. Every date/currency display
                     in the components goes through these — do not reintroduce
                     `.toLocaleTimeString()`/`.toDateString()`/bare
                     `.toLocaleString()` calls; they can render differently on
                     the server vs. the client and break hydration.

web/src/components/mission-control/
  Panel.tsx                 — generic titled card wrapper, used by every section
  StatusPill.tsx            — the one status-color vocabulary for the whole
                              screen (Case status, tool SUCCESS/FAILURE/NO_DATA,
                              approval status, audit actor)
  DemoDataBanner.tsx         — the "this is mock data" banner (keep until real
                              wiring lands)
  TopStatusBar.tsx           — §28 top bar (goal / coverage / production status / risk)
  JudgeControlStrip.tsx      — §31 three demo buttons (not wired — see below)
  CaseListPanel.tsx          — §28 left panel, QUEUED cases stacked separately
  AgentStateMachine.tsx      — Figure 2 FSM, static pipeline, current node highlighted
  LiveAgentTracePanel.tsx    — composes AgentStateMachine + cycle/budget counters + ToolCallFeed
  ToolCallFeed.tsx           — recent TOOL_CALL audit events as SUCCESS/FAILURE/NO_DATA badges
  RiskImpactSummary.tsx      — §11 RiskSignal[] table + continuityImpact
  InventoryCoveragePanel.tsx — §19/§26 usableStock vs currentStock, coverage_days, discrepancy flag
  SupplierShipmentPanel.tsx  — §17 eligibility per supplier (real function output) + PO/shipment status
  ValidatorChecklist.tsx     — §16 8-check pass/fail table
  DoNothingVsNexus.tsx       — §30 two-scenario comparison
  RecoveryPlanPanel.tsx      — composes plan allocations + ValidatorChecklist + DoNothingVsNexus
  ApprovalBoundaryPanel.tsx  — §21/Figure 1 dedicated human-approval-gate section (persistent, not just a modal)
  EscalationModal.tsx        — §28 "blocking-but-dismissable" escalation card
  PlanVersionLineage.tsx     — §23/Figure 3 V1→V2 diff (invalidated_assumptions / carried_forward_actions / reason_for_change)
  AuditTimeline.tsx          — §25 full chronological event feed
```

`web/tsconfig.json` gained a standard Next.js `"@/*": ["./src/*"]` path alias
(it didn't have one before) so the components above can import each other and
the fixture without long relative paths.

**`.gitignore` fix**: the bare `lib/` pattern was silently swallowing
`web/src/lib/**` (a legitimate source directory the scaffold's own
`web/src/lib/README.md` already reserved for "PRD-defined frontend
utilities"). Added `!web/src/lib/` immediately after it so future files there
aren't invisible to `git status`. If you add a genuine build-output `lib/`
directory elsewhere, this exception does not affect it.

### The demo scenario

One internally-consistent incident: SKU `COMP-ALPHA`, production order
`prod-914` (CRITICAL), a 24h shipment delay on `po-1001` that pushes it 12h
past the deadline. `usableStock`/`currentStock`/`dailyUsageRate`/
`safetyStockThreshold` reuse the PRD's own §19 worked example numbers. Plan V1
(350 units to Veloce Parts Co) genuinely fails the Validator's coverage check
(verified by hand-tracing the real `requiredMinimumCoverage` logic — short by
exactly 160 units); Plan V2 (510 units, the real shortfall) genuinely passes
all 8 checks. `QuickSource Inc` is included as a third supplier that fails the
§17 quality gate (0.4 < 0.7), demonstrating Hidden Test 3 in the supplier
panel. A second case (`case-2`, QUEUED) demonstrates the queueing UI.

### What's intentionally mocked / not yet done

- **No live data.** Nothing in `page.tsx` calls `/api/*`. The already-working
  API routes are untouched by this task.
- **Judge Control Strip buttons** (`JudgeControlStrip.tsx`) are clickable but
  only show a local "not wired yet" note — no event is fired.
- **Approve/Reject** (`ApprovalBoundaryPanel.tsx`, `EscalationModal.tsx`) only
  flip local React state (`useState` in `page.tsx`) — nothing is persisted,
  no audit event is created, and the Case's underlying status never advances
  (by design — implementing that would mean simulating the agent loop, which
  was explicitly out of scope for this task).
- **Only the primary case has full detail panels.** Selecting the queued case
  in the list shows a placeholder — the fixture doesn't model a second
  incident's full inventory/plan/audit trail.
- **`coverageDaysRemaining` in the top bar** is a single SKU's coverage days,
  not a true multi-SKU minimum (matches the same simplification already
  present in `/api/dashboard/summary`).

### Next recommended implementation step

Wire `page.tsx` to the real API routes: replace the `demoFixture` imports with
`fetch` calls to `/api/dashboard/summary` and `/api/cases/:id` (the routes
already return shapes very close to what these components expect — mainly
`doNothingVsNexus`, `productionOrder`, `inventory` need to flow through), wire
`JudgeControlStrip` to `POST /api/agent/event`, and wire
`ApprovalBoundaryPanel`/`EscalationModal` to `POST /api/approvals/:id/resolve`.
Add polling (the previous integration pass used a 4s `setInterval` calling
`POST /api/agent/tick`) once live data is flowing. At that point
`DemoDataBanner.tsx` and the `demo shell — not persisted` labels should come
out.

## Validation performed for the Mission Control shell task

- `pnpm --dir web exec tsc --noEmit` — clean
- `pnpm --dir web build` — succeeds, `/` prerenders as static (10.9 kB)
- `pnpm --filter web dev` + `curl` against `GET /` — 200, all ten required
  sections present in the rendered HTML (Cases, Live Agent Trace, Risk /
  Production Impact, Inventory & Coverage, Suppliers & Shipments, Recovery
  Plan, Human Approval Boundary, Audit Timeline, Plan Version Lineage, top
  status bar)
- Checked for hydration hazards directly: found and fixed three real ones
  (`toLocaleTimeString(undefined, …)`, `.toDateString()`, bare
  `.toLocaleString()`) that could render differently between server and
  client depending on the runtime's locale/timezone — replaced with
  deterministic UTC/explicit-locale helpers in `format.ts`. Confirmed by
  diffing two consecutive SSR responses byte-for-byte; the only remaining
  difference was Next.js's own internal dev-mode style-preload timestamp
  (framework instrumentation, not app code).
- `pnpm typecheck` and `pnpm test` (root, 47 tests) re-run after these changes
  to confirm zero regressions in `shared/` — this task touched no backend or
  shared-contract files.
- Responsive Tailwind classes (`grid-cols-1` base, `lg:grid-cols-[280px_1fr_380px]`
  override) verified present in the compiled output; **not** visually
  confirmed in an actual browser at a narrow viewport — no browser/screenshot
  tool is available in this environment. Recommend a manual check
  (`pnpm --filter web dev`, resize browser) before the live demo.
