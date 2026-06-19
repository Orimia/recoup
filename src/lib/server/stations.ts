// HMAC signing/verification for station-reported deposit events.
// The bin firmware and this server build the SAME canonical string and HMAC it
// with the station's shared secret, so a deposit event can't be spoofed from
// outside the bin. Keep this canonicalization identical in firmware.

import { createHmac, timingSafeEqual } from "node:crypto";

export type StationEvent = {
  stationId: string;
  nfcId: string;
  eventId: string;
  ts: number;
  material: string;
  weightG: number;
  verdict: "accept" | "reject";
};

// NOTE: weightG is intentionally NOT signed. It's a float, and float→string
// formatting differs between the firmware (C) and the server (JS), which would
// break the HMAC for legitimate events. Weight is informational only; the
// security-relevant fields (ids, ts, material, verdict) are all strings/ints.
export function canonical(e: StationEvent): string {
  return [e.stationId, e.nfcId, e.eventId, e.ts, e.material, e.verdict].join("|");
}

export function signEvent(secret: string, e: StationEvent): string {
  return createHmac("sha256", secret).update(canonical(e)).digest("hex");
}

export function verifyEvent(secret: string, e: StationEvent, hmac: string): boolean {
  if (!hmac) return false;
  const expected = signEvent(secret, e);
  const a = Buffer.from(hmac);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
