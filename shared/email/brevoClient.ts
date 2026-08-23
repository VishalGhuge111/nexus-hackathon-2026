// Real transactional email via Brevo's REST API (PS §5.6). A single JSON POST —
// no SDK dependency, mirroring how shared/llm/anthropicClient.ts is the only
// place that talks to an external provider. Server-side only: BREVO_API_KEY
// must never reach the browser, and this module is only ever imported from
// shared/tools/primitives.ts (Node-only tool execution path).
export interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
}

export type EmailDeliveryStatus = "SENT" | "FAILED" | "NOT_CONFIGURED";

export interface SendEmailResult {
  status: EmailDeliveryStatus;
  providerMessageId?: string;
  errorReason?: string;
}

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}

// Never throws — a provider/network failure must degrade to a reported status,
// not an exception, so a supplier email can never take down the recovery FSM.
export async function sendTransactionalEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    return { status: "NOT_CONFIGURED", errorReason: "BREVO_API_KEY or BREVO_SENDER_EMAIL is not set" };
  }

  try {
    const response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME || "NEXUS Supply Continuity Agent" },
        to: [{ email: params.to, name: params.toName }],
        subject: params.subject,
        htmlContent: params.htmlBody
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      return { status: "FAILED", errorReason: `Brevo API ${response.status}: ${errText.slice(0, 300)}` };
    }

    const json = (await response.json().catch(() => ({}))) as { messageId?: string };
    return { status: "SENT", providerMessageId: json.messageId };
  } catch (err) {
    return { status: "FAILED", errorReason: err instanceof Error ? err.message : String(err) };
  }
}
