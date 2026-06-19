import { insertUser, loadDB, newId } from "@/lib/server/db";
import { hashPassword, setSession } from "@/lib/server/auth";
import { bad, ok, readJson, str } from "@/lib/server/http";
import { publicUser, userStats } from "@/lib/server/views";
import { config, emailDomainAllowed } from "@/lib/server/config";
import { rateLimit, clientIp } from "@/lib/server/ratelimit";
import { newVerifyToken, sendVerificationEmail } from "@/lib/server/email";
import type { User } from "@/lib/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  // Flood control: cap signups per IP. Tuned high because a campus NAT makes a
  // whole dorm share one IP (see config). Email verification is the real Sybil gate.
  const rl = rateLimit(`signup:${clientIp(req)}`, config.signupsPerIpPerHour, 60 * 60 * 1000);
  if (!rl.ok) return bad("Too many signups from this network. Try again later.", 429);

  const body = await readJson(req);
  const name = str(body.name);
  const handle = str(body.handle).toLowerCase();
  const email = str(body.email).toLowerCase();
  const password = str(body.password);
  const teamId = str(body.teamId);
  const consent = body.consent === true;

  if (!name) return bad("Name is required.");
  if (!HANDLE_RE.test(handle))
    return bad("Handle must be 3–20 chars: letters, numbers, underscore.");
  if (!EMAIL_RE.test(email)) return bad("Enter a valid email address.");
  if (!emailDomainAllowed(email)) {
    const allowed = config.allowedEmailDomains.join(", ");
    return bad(`Use your university email (${allowed}).`);
  }
  if (password.length < 8) return bad("Password must be at least 8 characters.");
  if (!consent) return bad("Please accept the pilot terms & privacy notice to join.");

  const db = await loadDB();
  if (!db.teams.some((t) => t.id === teamId)) return bad("Pick a team to compete for.");
  if (db.users.some((u) => u.handle === handle)) return bad("That handle is taken.");
  if (db.users.some((u) => u.email === email)) return bad("That email already has an account.");

  const { hash, salt } = hashPassword(password);
  const { token, expires } = newVerifyToken();
  const user: User = {
    id: newId("user"),
    handle,
    name,
    email,
    passwordHash: hash,
    passwordSalt: salt,
    teamId,
    points: 0,
    lifetimePoints: 0,
    deposits: 0,
    streakDays: 0,
    lastDepositDay: null,
    createdAt: Date.now(),
    emailVerified: false,
    verifyToken: token,
    verifyExpires: expires,
    failedLogins: 0,
    lockedUntil: null,
    consentAt: Date.now(),
    nfcId: null,
  };
  await insertUser(user);
  await setSession(user.id);

  // Send (or, in dev, log) the verification link. Surface the dev link so a demo
  // can complete verification without a real mailbox.
  const sent = await sendVerificationEmail(email, token);

  const db2 = await loadDB();
  return ok(
    {
      user: publicUser(user, db2),
      stats: userStats(user, db2),
      verification: { sent: sent.method, devLink: sent.devLink ?? null },
    },
    201
  );
}
