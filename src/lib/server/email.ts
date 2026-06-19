// Email verification: token generation + a pluggable sender.
// - With RESEND_API_KEY set, sends a real email via Resend's HTTP API (no SDK).
// - Without a key (local/dev), logs the verification link to the server console so
//   the flow is fully testable, and we surface the link to the client in dev so a
//   demo can complete verification without a mailbox.

import { randomBytes } from "node:crypto";
import { config } from "./config";

export function newVerifyToken(): { token: string; expires: number } {
  return {
    token: randomBytes(24).toString("hex"),
    expires: Date.now() + config.verifyTokenTtlHours * 60 * 60 * 1000,
  };
}

export function verifyLink(token: string): string {
  return `${config.appUrl}/verify?token=${token}`;
}

export type SendResult = { method: "resend" | "console"; devLink?: string };

export async function sendVerificationEmail(to: string, token: string): Promise<SendResult> {
  const link = verifyLink(token);

  if (config.resendApiKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: config.resendFrom,
          to,
          subject: "Verify your VandyLoop account",
          html: `<p>Welcome to the VandyLoop challenge.</p>
<p>Confirm your email to start redeeming rewards:</p>
<p><a href="${link}">Verify my account</a></p>
<p>This link expires in ${config.verifyTokenTtlHours} hours.</p>`,
        }),
      });
      return { method: "resend" };
    } catch {
      // fall through to console so signup never hard-fails on email outage
    }
  }

  // Dev/demo path: no email provider configured.
  console.log(`[VandyLoop] verification link for ${to}: ${link}`);
  return { method: "console", devLink: link };
}
