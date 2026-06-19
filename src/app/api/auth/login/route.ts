import { loadDB, updateUser } from "@/lib/server/db";
import { setSession, verifyPassword } from "@/lib/server/auth";
import { bad, ok, readJson, str } from "@/lib/server/http";
import { publicUser, userStats } from "@/lib/server/views";
import { config } from "@/lib/server/config";
import { rateLimit, clientIp } from "@/lib/server/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Per-IP flood control on top of per-account lockout. High default for shared
  // campus NAT; the per-account lockout below is the real brute-force defense.
  const rl = rateLimit(`login:${clientIp(req)}`, config.loginsPerIpPer10Min, 10 * 60 * 1000);
  if (!rl.ok) return bad("Too many attempts. Wait a few minutes.", 429);

  const body = await readJson(req);
  const email = str(body.email).toLowerCase();
  const password = str(body.password);
  if (!email || !password) return bad("Email and password are required.");

  const db = await loadDB();
  const user = db.users.find((u) => u.email === email);
  if (!user) return bad("Incorrect email or password.", 401);

  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    const mins = Math.ceil((user.lockedUntil - Date.now()) / 60000);
    return bad(`Account locked after too many attempts. Try again in ${mins} min.`, 423);
  }

  if (!verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    const failedLogins = user.failedLogins + 1;
    if (failedLogins >= config.maxFailedLogins) {
      await updateUser(user.id, { failedLogins: 0, lockedUntil: Date.now() + config.lockoutMinutes * 60 * 1000 });
    } else {
      await updateUser(user.id, { failedLogins });
    }
    return bad("Incorrect email or password.", 401);
  }

  await updateUser(user.id, { failedLogins: 0, lockedUntil: null });
  await setSession(user.id);
  const db2 = await loadDB();
  const updated = db2.users.find((u) => u.id === user.id)!;
  return ok({ user: publicUser(updated, db2), stats: userStats(updated, db2) });
}
