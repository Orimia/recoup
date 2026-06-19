import { bumpUser, loadDB, voidDepositOnce } from "@/lib/server/db";
import { bad, ok, readJson, str } from "@/lib/server/http";
import { adminAuthed } from "@/lib/server/admin";
import { publicUser } from "@/lib/server/views";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Claw-back: void a deposit and reverse its points. Because points (not money)
// are at stake, fraud is fully reversible — the core reason the standalone-points
// model is safe to run before any meal-money integration.
export async function POST(req: Request) {
  if (!adminAuthed(req)) return bad("Operator key required.", 401);

  const depositId = str((await readJson(req)).depositId);
  const db = await loadDB();
  const deposit = db.deposits.find((d) => d.id === depositId);
  if (!deposit) return bad("Unknown deposit.", 404);
  if (deposit.voided) return bad("Already voided.");

  // Atomic + idempotent: flips voided and returns the points to reverse exactly
  // once, even under two concurrent void requests. null = it was already voided.
  const reversed = await voidDepositOnce(deposit.id);
  if (reversed === null) return bad("Already voided.");

  if (reversed > 0) {
    // Negative deltas; bump() clamps at 0 so a balance already spent down can't go negative.
    await bumpUser(deposit.userId, { points: -reversed, lifetimePoints: -reversed });
  }

  const db2 = await loadDB();
  const updated = db2.users.find((u) => u.id === deposit.userId);
  return ok({ voided: true, user: updated ? publicUser(updated, db2) : null });
}
