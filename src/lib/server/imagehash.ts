// Replay defense for deposit photos. We hash the image bytes (SHA-256) and reject
// a submission whose hash already exists in recent deposits — so you can't farm by
// photographing one can and submitting it repeatedly.
//
// NOTE: this catches exact-file reuse. A re-encoded/cropped copy would slip past a
// byte hash; the production upgrade is a perceptual hash (pHash/aHash over decoded
// pixels). Documented in SECURITY.md. Byte-hash is the cheap, reliable first line.

import { createHash } from "node:crypto";

const DATA_URL_RE = /^data:image\/[a-zA-Z+]+;base64,(.+)$/;

/** Returns a hex SHA-256 of the image payload, or null if there's no usable image. */
export function hashImage(imageDataUrl: string | undefined): string | null {
  if (!imageDataUrl) return null;
  const m = imageDataUrl.match(DATA_URL_RE);
  const base64 = m ? m[1] : imageDataUrl;
  try {
    const buf = Buffer.from(base64, "base64");
    if (buf.length === 0) return null;
    return createHash("sha256").update(buf).digest("hex");
  } catch {
    return null;
  }
}
