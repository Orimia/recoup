import { loadDB } from "@/lib/server/db";
import { ok, bad } from "@/lib/server/http";
import { currentBinCode, secondsUntilRotate } from "@/lib/server/bincodes";
import { config } from "@/lib/server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the rotating code a bin's QR sticker would currently display.
//
// In production (strict) this MUST NOT be readable over the network — the whole
// point of a rotating code is that you have to be physically at the bin to read
// it. So in strict mode we withhold the code and the client reads it from the
// physical QR. In demo mode we expose it so the flow is exercisable without a
// real sticker.
export async function GET(req: Request) {
  const code = (new URL(req.url).searchParams.get("bin") ?? "").toUpperCase();
  const db = await loadDB();
  const bin = db.bins.find((b) => b.code === code);
  if (!bin) return bad("Unknown bin.", 404);

  const reveal = !config.strict;
  return ok({
    bin: bin.code,
    code: reveal ? currentBinCode(bin.code) : null,
    reveal, // false in strict mode → client shows a manual code entry
    strict: config.strict,
    rotatesInSec: secondsUntilRotate(),
    lat: bin.lat,
    lng: bin.lng,
  });
}
