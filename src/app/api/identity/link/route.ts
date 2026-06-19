import { getSessionUser } from "@/lib/server/auth";
import { loadDB, updateUser } from "@/lib/server/db";
import { bad, ok, readJson, str } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Link a physical tap identity (VandyID card UID / wallet token) to the signed-in
// account, so a bin can attribute deposits to this student. One-time per student.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return bad("Sign in first.", 401);

  const nfcId = str((await readJson(req)).nfcId);
  if (!nfcId) return bad("Missing tap id.");

  const taken = (await loadDB()).users.find((u) => u.nfcId === nfcId && u.id !== user.id);
  if (taken) return bad("That card is already linked to another account.", 409);

  await updateUser(user.id, { nfcId });
  return ok({ linked: true, nfcId });
}
