import { getSessionUser } from "@/lib/server/auth";
import { updateUser } from "@/lib/server/db";
import { ok, bad } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/ratelimit";
import { newVerifyToken, sendVerificationEmail } from "@/lib/server/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Re-issue a verification link for the signed-in user.
export async function POST() {
  const user = await getSessionUser();
  if (!user) return bad("Sign in first.", 401);
  if (user.emailVerified) return ok({ alreadyVerified: true });

  const rl = rateLimit(`resend:${user.id}`, 3, 15 * 60 * 1000);
  if (!rl.ok) return bad("Please wait before requesting another link.", 429);

  const { token, expires } = newVerifyToken();
  await updateUser(user.id, { verifyToken: token, verifyExpires: expires });
  const sent = await sendVerificationEmail(user.email, token);
  return ok({ sent: sent.method, devLink: sent.devLink ?? null });
}
