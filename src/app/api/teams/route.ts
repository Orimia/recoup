import { loadDB } from "@/lib/server/db";
import { ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = await loadDB();
  const teams = db.teams.map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    region: t.region,
    seed: t.seed,
  }));
  return ok({ teams });
}
