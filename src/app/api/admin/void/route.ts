import { loadDB, updateDeposit, updateUser } from "@/lib/server/db";
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

  const reversed = deposit.pointsAwarded;
  await updateDeposit(deposit.id, { voided: true, pointsAwarded: 0 });

  const user = db.users.find((u) => u.id === deposit.userId);
  if (user) {
    await updateUser(user.id, {
      points: Math.max(0, user.points - reversed),
      lifetimePoints: Math.max(0, user.lifetimePoints - reversed),
    });
  }

  const db2 = await loadDB();
  const updated = user ? db2.users.find((u) => u.id === user.id) : null;
  return ok({ voided: true, user: updated ? publicUser(updated, db2) : null });
}
