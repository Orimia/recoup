import { loadDB } from "@/lib/server/db";
import { ok, bad } from "@/lib/server/http";
import { adminStats } from "@/lib/server/views";
import { isAiEnabled } from "@/lib/server/classify";
import { adminAuthed } from "@/lib/server/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!adminAuthed(req)) return bad("Operator key required.", 401);
  return ok({ ...adminStats(await loadDB()), aiEnabled: isAiEnabled() });
}
