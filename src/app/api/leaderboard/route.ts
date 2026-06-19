import { loadDB } from "@/lib/server/db";
import { ok } from "@/lib/server/http";
import { leaderboard } from "@/lib/server/views";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return ok(leaderboard(await loadDB()));
}
