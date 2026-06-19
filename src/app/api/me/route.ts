import { getSessionUser } from "@/lib/server/auth";
import { loadDB } from "@/lib/server/db";
import { ok } from "@/lib/server/http";
import { publicUser, userStats } from "@/lib/server/views";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return ok({ user: null });
  const db = await loadDB();
  return ok({ user: publicUser(user, db), stats: userStats(user, db) });
}
