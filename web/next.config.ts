import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nexus/shared"],
  // Disabled to eliminate a proven concurrency hazard: StrictMode's dev-mode
  // mount->cleanup->remount double-invokes web/src/app/page.tsx's live-polling
  // useEffect, sending two overlapping POST /api/agent/tick requests for the
  // same case. shared/agent/fsm.ts has no per-case lock, so two concurrent
  // ticks can both read stale state and both write conflicting results (empirically
  // reproduced: two RecoveryPlanVersion records both numbered `1` for one case).
  // This does not fix the underlying race in the FSM/store layer — it removes
  // the one guaranteed trigger for it in local dev.
  reactStrictMode: false
};

export default nextConfig;
