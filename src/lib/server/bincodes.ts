// Rotating per-bin code (TOTP-style). The physical QR sticker on a bin would
// display/encode the *current* code, which changes every window. A deposit must
// present a code valid for its bin right now — so a screenshot of the QR posted
// online is useless a couple minutes later.
//
// code = first 6 digits of HMAC-SHA256(secret, `${binCode}:${windowIndex}`)

import { createHmac } from "node:crypto";
import { config } from "./config";

function codeForWindow(binCode: string, windowIndex: number): string {
  const mac = createHmac("sha256", config.binCodeSecret)
    .update(`${binCode}:${windowIndex}`)
    .digest();
  // Dynamic truncation → 6-digit numeric code.
  const offset = mac[mac.length - 1] & 0xf;
  const bin =
    ((mac[offset] & 0x7f) << 24) |
    ((mac[offset + 1] & 0xff) << 16) |
    ((mac[offset + 2] & 0xff) << 8) |
    (mac[offset + 3] & 0xff);
  return String(bin % 1_000_000).padStart(6, "0");
}

function currentWindow(now: number): number {
  return Math.floor(now / 1000 / config.binCodeWindowSec);
}

/** The code a bin's QR would currently display. */
export function currentBinCode(binCode: string, now: number = Date.now()): string {
  return codeForWindow(binCode, currentWindow(now));
}

/** Validate a submitted code against the current window (± 1 for scan/clock skew). */
export function verifyBinCode(
  binCode: string,
  submitted: string | undefined,
  now: number = Date.now()
): boolean {
  if (!submitted) return false;
  const w = currentWindow(now);
  for (const i of [w, w - 1, w + 1]) {
    if (codeForWindow(binCode, i) === submitted) return true;
  }
  return false;
}

export function secondsUntilRotate(now: number = Date.now()): number {
  const win = config.binCodeWindowSec;
  return win - (Math.floor(now / 1000) % win);
}
