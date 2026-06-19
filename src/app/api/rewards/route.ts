import { loadDB } from "@/lib/server/db";
import { ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = await loadDB();
  return ok({ rewards: db.rewards });
}
