# NEXUS

NEXUS is the project defined by the locked product requirements document in `PRD.md`.

- Frontend: `web/`
- Backend: `web/src/app/api/` (Next.js API Routes on Vercel)
- Database: `prisma/` (PostgreSQL on Neon)
- Shared contracts: `shared/`
- Tests: `tests/`
- Runtime: Node.js 22 LTS, pnpm 10.15.0

`PRD.md` is the locked source of truth. No implementation should contradict it.

## Running locally

```
pnpm install
pnpm test              # deterministic formulas, validator, eligibility, ranking, full FSM integration test
pnpm typecheck          # shared/ + tests/
pnpm dev:web            # Mission Control UI + API routes at http://localhost:3000
```

With no `DATABASE_URL` / `ANTHROPIC_API_KEY` set, `dev:web` runs against an in-memory
store pre-loaded with the demo fixture (`shared/db/demoSeed.ts`) and a deterministic
local stand-in for Claude (`shared/llm/stubClient.ts`) — the full agent loop is
runnable with zero external credentials. Set both env vars (see `.env.example`) to
run against real Neon Postgres (`prisma/seed.ts` seeds the same fixture) and real
Claude Sonnet.

Trigger the one currently-wired demo scenario (Shipment Delay 24h) via the "Judge
Event" button in the UI, or directly:
```
curl -X POST localhost:3000/api/agent/event -H "Content-Type: application/json" \
  -d '{"type":"SHIPMENT_DELAY","payload":{"poId":"po-1001","delayHours":24}}'
```
