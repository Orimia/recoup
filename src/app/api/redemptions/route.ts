import { getSessionUser } from "@/lib/server/auth";
import { bumpUser, insertRedemption, loadDB, newId, spendUserPoints } from "@/lib/server/db";
import { bad, ok, readJson, str } from "@/lib/server/http";
import { publicUser } from "@/lib/server/views";
import { config } from "@/lib/server/config";
import type { Redemption } from "@/lib/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return bad("Sign in to redeem.", 401);

  // Value gate: redeeming requires a verified email. This is the one place where
  // something of value leaves the system, so it's where we enforce real identity.
  if (config.requireVerifiedForRedeem && !sessionUser.emailVerified) {
    return bad("Verify your email before redeeming rewards.", 403);
  }

  const rewardId = str((await readJson(req)).rewardId);
  const db = await loadDB();
  const reward = db.rewards.find((r) => r.id === rewardId);
  if (!reward) return bad("Unknown reward.");

  // Atomic conditional debit: succeeds only if the balance still covers the cost.
  // Two concurrent redeems can't both pass (the second sees the debited balance),
  // so a reward can't be double-spent. lifetimePoints is untouched — standing holds.
  const debited = await spendUserPoints(sessionUser.id, reward.cost);
  if (!debited) return bad("Not enough points yet.", 402);

  const redemption: Redemption = {
    id: newId("rdm"),
    userId: sessionUser.id,
    rewardId: reward.id,
    rewardName: reward.name,
    cost: reward.cost,
    status: "issued",
    createdAt: Date.now(),
  };

  try {
    await insertRedemption(redemption);
  } catch (e) {
    // Recording failed after debiting — refund so points aren't silently lost.
    await bumpUser(sessionUser.id, { points: reward.cost });
    throw e;
  }

  const db2 = await loadDB();
  const updated = db2.users.find((u) => u.id === sessionUser.id);
  if (!updated) return bad("Account not found.", 404);
  return ok({ redemption, user: publicUser(updated, db2) });
}
