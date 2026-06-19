import { loadDB } from "@/lib/server/db";
import { ok } from "@/lib/server/http";
import { isAiEnabled } from "@/lib/server/classify";
import { config } from "@/lib/server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = await loadDB();
  return ok({ bins: db.bins, aiEnabled: isAiEnabled(), strict: config.strict });
}
