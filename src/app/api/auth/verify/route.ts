import { loadDB, updateUser } from "@/lib/server/db";
import { ok, bad } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/auth/verify?token=... — confirms an email and flips emailVerified.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) return bad("Missing verification token.");

  const user = (await loadDB()).users.find((u) => u.verifyToken === token);
  if (!user) return bad("This verification link is invalid or already used.", 404);
  if (user.verifyExpires && user.verifyExpires < Date.now()) {
    return bad("This verification link has expired. Request a new one.", 410);
  }

  await updateUser(user.id, { emailVerified: true, verifyToken: null, verifyExpires: null });

  return ok({ verified: true, handle: user.handle });
}
