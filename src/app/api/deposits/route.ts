import { getSessionUser } from "@/lib/server/auth";
import { bumpUser, insertDeposit, loadDB, newId } from "@/lib/server/db";
import { bad, ok, readJson, str } from "@/lib/server/http";
import { classify } from "@/lib/server/classify";
import { award, dayKey } from "@/lib/challenge/points";
import { publicUser, userStats } from "@/lib/server/views";
import { config } from "@/lib/server/config";
import { verifyBinCode } from "@/lib/server/bincodes";
import { checkGeofence } from "@/lib/server/geo";
import { hashImage } from "@/lib/server/imagehash";
import { assess, flagReason, isHardFail } from "@/lib/server/fraud";
import type { Deposit } from "@/lib/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return bad("Sign in to log a return.", 401);

  const body = await readJson(req);
  const binCode = str(body.binCode).toUpperCase();
  const submittedCode = str(body.code) || undefined; // rotating code from the bin QR
  const imageDataUrl = typeof body.image === "string" ? body.image : undefined;
  const lat = typeof body.lat === "number" ? body.lat : undefined;
  const lng = typeof body.lng === "number" ? body.lng : undefined;

  const db = await loadDB();
  const bin = db.bins.find((b) => b.code === binCode);
  if (!bin) return bad("Unknown bin code. Scan the QR on a VandyLoop bin.");

  // ---- Verification signals -------------------------------------------------
  const now = Date.now();
  const imageHash = hashImage(imageDataUrl);
  const cutoff = now - config.duplicateImageWindowDays * 24 * 60 * 60 * 1000;
  const duplicateImage =
    !!imageHash && db.deposits.some((d) => d.imageHash === imageHash && d.createdAt >= cutoff);

  const geo = checkGeofence(bin.lat, bin.lng, lat, lng, config.geofenceRadiusM);
  const binCodeProvided = !!submittedCode;
  const binCodeValid = binCodeProvided && verifyBinCode(binCode, submittedCode, now);

  const recentByUser = db.deposits.filter(
    (d) => d.userId === sessionUser.id && now - d.createdAt < 60_000
  ).length;
  const rateBurst = recentByUser >= 6;

  const { flags, trust } = assess({
    hasPhoto: !!imageDataUrl,
    binCodeProvided,
    binCodeValid,
    geoProvided: geo.provided,
    geoOk: geo.ok,
    duplicateImage,
    rateBurst,
  });

  // Presence must be positively established by at least one strong signal:
  // a currently-valid rotating bin code OR being inside the geofence. Absence of
  // both is not just "unverified" — in strict mode it's a rejection (otherwise a
  // bare API call with neither signal would slip through with only soft flags).
  const presenceProven = binCodeValid || geo.ok;

  // Strict posture: hard-reject before recording. Demo posture: record + flag.
  if (config.strict && (isHardFail(flags) || !presenceProven)) {
    const reason = !presenceProven
      ? "Couldn't verify you're at the bin. Scan the bin's current code or enable location."
      : flagReason(flags);
    return bad(reason, 422);
  }

  // ---- Classification (Claude vision when configured, else heuristic) -------
  const c = await classify(imageDataUrl);

  // ---- Scoring --------------------------------------------------------------
  const today = dayKey();
  const countedToday = db.deposits.filter(
    (d) => d.userId === sessionUser.id && dayKey(d.createdAt) === today && d.pointsAwarded > 0
  ).length;
  const result = award({
    material: c.material,
    countedToday,
    lastDepositDay: sessionUser.lastDepositDay,
    streakDays: sessionUser.streakDays,
    cap: config.dailyDepositCap,
  });

  // Duplicate image is unambiguous abuse: zero points even in demo mode.
  let points = result.points;
  let countsTowardStreak = result.countedTowardCap;
  let note = c.note;
  if (duplicateImage) {
    points = 0;
    countsTowardStreak = false;
    note = "Duplicate photo detected, no points awarded.";
  }

  const deposit: Deposit = {
    id: newId("dep"),
    userId: sessionUser.id,
    binCode,
    material: c.material,
    confidence: c.confidence,
    classifiedBy: c.classifiedBy,
    contaminants: c.contaminants,
    pointsAwarded: points,
    note,
    createdAt: now,
    flags,
    trust,
    imageHash,
    distanceM: geo.distanceM,
    voided: false,
  };

  await insertDeposit(deposit);
  // Atomic increment so two concurrent deposits from the same user can't lose
  // points to a read-modify-write race (both reading the same snapshot balance).
  await bumpUser(
    sessionUser.id,
    { points, lifetimePoints: points, deposits: 1 },
    countsTowardStreak ? { streakDays: result.newStreakDays, lastDepositDay: today } : undefined
  );

  const db2 = await loadDB();
  const updated = db2.users.find((u) => u.id === sessionUser.id);
  if (!updated) return bad("Account not found.", 404);

  return ok({
    deposit: {
      material: deposit.material,
      confidence: deposit.confidence,
      classifiedBy: deposit.classifiedBy,
      contaminants: deposit.contaminants,
      pointsAwarded: deposit.pointsAwarded,
      binName: bin.name,
      note: deposit.note,
      flags: deposit.flags,
      trust: deposit.trust,
      distanceM: deposit.distanceM,
    },
    award: {
      reason: duplicateImage ? note : result.reason,
      streakDays: countsTowardStreak ? result.newStreakDays : sessionUser.streakDays,
    },
    user: publicUser(updated, db2),
    stats: userStats(updated, db2),
  });
}
