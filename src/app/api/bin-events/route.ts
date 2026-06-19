import { insertDeposit, loadDB, updateUser } from "@/lib/server/db";
import { bad, ok, readJson, str } from "@/lib/server/http";
import { verifyEvent, type StationEvent } from "@/lib/server/stations";
import { award, dayKey } from "@/lib/challenge/points";
import { config } from "@/lib/server/config";
import { publicUser } from "@/lib/server/views";
import type { Deposit, Material, User } from "@/lib/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SKEW_MS = 5 * 60 * 1000;

// The hard-trust verification path: a registered bin reports a sensor-verified
// deposit, HMAC-signed with its station secret. No photo/geo — the bin is the proof.
export async function POST(req: Request) {
  const body = await readJson(req);
  const stationId = str(body.stationId);
  const nfcId = str(body.nfcId);
  const eventId = str(body.eventId);
  const ts = typeof body.ts === "number" ? body.ts : 0;
  const material = str(body.material) as Material;
  const weightG = typeof body.weightG === "number" ? body.weightG : 0;
  const verdict = str(body.verdict) === "reject" ? "reject" : "accept";
  const hmac = str(body.hmac);

  if (!stationId || !nfcId || !eventId || !ts) return bad("Malformed event.");

  const db = await loadDB();
  const station = db.stations.find((s) => s.id === stationId);
  if (!station) return bad("Unknown station.", 404);

  const evt: StationEvent = { stationId, nfcId, eventId, ts, material, weightG, verdict };
  if (!verifyEvent(station.secret, evt, hmac)) return bad("Bad signature.", 401);
  if (Math.abs(Date.now() - ts) > SKEW_MS) return bad("Stale event.", 400);

  // Idempotent replay protection: a retried event must not double-award.
  if (db.deposits.some((d) => d.eventId === eventId)) {
    return ok({ duplicate: true });
  }

  const user = db.users.find((u) => u.nfcId === nfcId);
  if (!user) return bad("This card isn't linked to a VandyLoop account yet.", 409);

  const isAluminum = verdict === "accept" && material === "aluminum";
  const today = dayKey();
  const countedToday = db.deposits.filter(
    (d) => d.userId === user.id && dayKey(d.createdAt) === today && d.pointsAwarded > 0
  ).length;
  const result = award({
    material: isAluminum ? "aluminum" : "contaminant",
    countedToday,
    lastDepositDay: user.lastDepositDay,
    streakDays: user.streakDays,
    cap: config.dailyDepositCap,
  });

  const deposit: Deposit = {
    // Deterministic id from eventId → a concurrent duplicate can't create a second
    // row (ON CONFLICT(id) is a no-op), on top of the sequential dedup check above.
    id: `dep-evt-${eventId}`,
    userId: user.id,
    binCode: station.binCode,
    material: isAluminum ? "aluminum" : "contaminant",
    confidence: 1, // hardware-verified
    classifiedBy: "sensor",
    contaminants: isAluminum ? [] : ["rejected at bin"],
    pointsAwarded: result.points,
    note: isAluminum ? "Verified at bin (sensor fusion)" : "Rejected at bin — not aluminum",
    createdAt: Date.now(),
    flags: [],
    trust: 1,
    imageHash: null,
    distanceM: null,
    voided: false,
    source: "station",
    stationId,
    eventId,
  };

  await insertDeposit(deposit);
  if (result.points > 0) {
    const patch: Partial<User> = {
      points: user.points + result.points,
      lifetimePoints: user.lifetimePoints + result.points,
      deposits: user.deposits + 1,
    };
    if (result.countedTowardCap) {
      patch.streakDays = result.newStreakDays;
      patch.lastDepositDay = today;
    }
    await updateUser(user.id, patch);
  } else {
    await updateUser(user.id, { deposits: user.deposits + 1 });
  }

  const db2 = await loadDB();
  const updated = db2.users.find((u) => u.id === user.id)!;
  return ok({
    accepted: isAluminum,
    pointsAwarded: result.points,
    reason: result.reason,
    handle: updated.handle,
    user: publicUser(updated, db2),
  });
}
