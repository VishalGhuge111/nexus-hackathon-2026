// GET /api/system/status — real runtime configuration for the Settings page.
// Only reports WHETHER each credential env var is set (never its value) plus
// non-secret agent-policy constants already defined in shared/config.ts —
// nothing here is invented, and nothing here is a secret.
import { SONNET_MODEL } from "@nexus/shared/llm/anthropicClient";
import {
  MAX_TOOL_CALLS_PER_CASE,
  MAX_REPLANS,
  DEFAULT_APPROVAL_THRESHOLD,
  DEFAULT_MIN_QUALITY_FOR_CASE,
  DEFAULT_MIN_RELIABILITY_FOR_CASE
} from "@nexus/shared/config";

export async function GET(): Promise<Response> {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);

  return Response.json({
    database: {
      mode: hasDatabaseUrl ? "neon" : "memory",
      configured: hasDatabaseUrl,
      description: hasDatabaseUrl
        ? "DATABASE_URL is set — running against Prisma/Neon Postgres."
        : "DATABASE_URL is not set — running against the in-memory local/test store (data does not persist across restarts)."
    },
    llm: {
      mode: hasAnthropicKey ? "anthropic" : "stub",
      configured: hasAnthropicKey,
      model: hasAnthropicKey ? SONNET_MODEL : null,
      description: hasAnthropicKey
        ? `ANTHROPIC_API_KEY is set — recovery plans are proposed by the real ${SONNET_MODEL} model.`
        : "ANTHROPIC_API_KEY is not set — recovery plans are proposed by the deterministic local stand-in, not a live model."
    },
    agentConfig: {
      maxToolCallsPerCase: MAX_TOOL_CALLS_PER_CASE,
      maxReplans: MAX_REPLANS,
      approvalThreshold: DEFAULT_APPROVAL_THRESHOLD,
      minSupplierQualityForCase: DEFAULT_MIN_QUALITY_FOR_CASE,
      minSupplierReliabilityForCase: DEFAULT_MIN_RELIABILITY_FOR_CASE
    },
    runtime: {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV ?? "unknown"
    }
  });
}
