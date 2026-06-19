import { getSessionUser } from "@/lib/server/auth";
import { insertRedemption, loadDB, newId, updateUser } from "@/lib/server/db";
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
  if (sessionUser.points < reward.cost) return bad("Not enough points yet.", 402);

  const redemption: Redemption = {
    id: newId("rdm"),
    userId: sessionUser.id,
    rewardId: reward.id,
    rewardName: reward.name,
    cost: reward.cost,
    status: "issued",
    createdAt: Date.now(),
  };

  // lifetimePoints is untouched — leaderboard standing stays.
  await updateUser(sessionUser.id, { points: sessionUser.points - reward.cost });
  await insertRedemption(redemption);

  const db2 = await loadDB();
  const updated = db2.users.find((u) => u.id === sessionUser.id)!;
  return ok({ redemption, user: publicUser(updated, db2) });
}
