import { clearSession } from "@/lib/server/auth";
import { ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await clearSession();
  return ok({ ok: true });
}
