import { randomBytes } from "node:crypto";
import { insertStation, loadDB, newId } from "@/lib/server/db";
import { bad, ok, readJson, str } from "@/lib/server/http";
import { adminAuthed } from "@/lib/server/admin";
import type { Station } from "@/lib/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — list registered stations (no secrets).
export async function GET(req: Request) {
  if (!adminAuthed(req)) return bad("Operator key required.", 401);
  const stations = (await loadDB()).stations.map((s) => ({
    id: s.id,
    name: s.name,
    binCode: s.binCode,
    createdAt: s.createdAt,
  }));
  return ok({ stations });
}

// POST — register a new bin/station. Returns the secret ONCE (provision the
// firmware with it). { name, binCode } -> { id, secret }.
export async function POST(req: Request) {
  if (!adminAuthed(req)) return bad("Operator key required.", 401);
  const body = await readJson(req);
  const name = str(body.name) || "VandyLoop station";
  const binCode = str(body.binCode).toUpperCase();
  if (!binCode) return bad("binCode is required.");

  const db = await loadDB();
  if (!db.bins.some((b) => b.code === binCode)) return bad("Unknown bin code.");

  const station: Station = {
    id: newId("station"),
    name,
    binCode,
    secret: randomBytes(24).toString("hex"),
    createdAt: Date.now(),
  };
  await insertStation(station);

  // Secret is returned exactly once, for firmware provisioning.
  return ok({ id: station.id, name: station.name, binCode: station.binCode, secret: station.secret }, 201);
}
