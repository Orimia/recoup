import { ok } from "@/lib/server/http";
import { config } from "@/lib/server/config";
import { isAiEnabled } from "@/lib/server/classify";
import { loadDB } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight liveness + config check for uptime monitors and post-deploy smoke.
export async function GET() {
  let store: "ok" | "error" = "ok";
  let users = 0;
  try {
    users = (await loadDB()).users.length;
  } catch {
    store = "error";
  }
  return ok({
    ok: store === "ok",
    mode: config.strict ? "strict" : "demo",
    aiVision: isAiEnabled() ? "live" : "simulated",
    emailProvider: config.resendApiKey ? "resend" : "console",
    openSignup: config.allowAnyDomain,
    store,
    users,
  });
}
