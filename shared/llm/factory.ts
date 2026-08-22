import type { LlmClient } from "./types";
import { AnthropicLlmClient } from "./anthropicClient";
import { StubLlmClient } from "./stubClient";

declare global {
  // eslint-disable-next-line no-var
  var __nexusLlmClient: LlmClient | undefined;
}

export function getLlmClient(): LlmClient {
  if (global.__nexusLlmClient) return global.__nexusLlmClient;
  global.__nexusLlmClient = process.env.ANTHROPIC_API_KEY
    ? new AnthropicLlmClient(process.env.ANTHROPIC_API_KEY)
    : new StubLlmClient({ forceInitialUndershoot: true });
  return global.__nexusLlmClient;
}
