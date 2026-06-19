// Turns raw verification signals into fraud flags + a trust score.
// Trust is a 0–1 composite: 1.0 = all checks passed, lower = more suspicious.
// The deposit route decides what to do with it based on enforcement posture.

import type { FraudFlag } from "./types";

export type Signals = {
  hasPhoto: boolean;
  binCodeProvided: boolean;
  binCodeValid: boolean;
  geoProvided: boolean;
  geoOk: boolean;
  duplicateImage: boolean;
  rateBurst: boolean;
};

const WEIGHTS: Record<FraudFlag, number> = {
  duplicate_image: 0.8,
  geofence_fail: 0.45,
  bad_bin_code: 0.45,
  rate_burst: 0.3,
  location_unverified: 0.2,
  no_photo: 0.15,
};

export function assess(s: Signals): { flags: FraudFlag[]; trust: number } {
  const flags: FraudFlag[] = [];
  if (!s.hasPhoto) flags.push("no_photo");
  if (!s.geoProvided) flags.push("location_unverified");
  else if (!s.geoOk) flags.push("geofence_fail");
  if (s.binCodeProvided && !s.binCodeValid) flags.push("bad_bin_code");
  if (s.duplicateImage) flags.push("duplicate_image");
  if (s.rateBurst) flags.push("rate_burst");

  const penalty = flags.reduce((sum, f) => sum + WEIGHTS[f], 0);
  const trust = Math.max(0, Math.min(1, 1 - penalty));
  return { flags, trust };
}

/** Flags that represent unambiguous abuse vs. merely-unverified presence. */
export function isHardFail(flags: FraudFlag[]): boolean {
  return flags.some((f) => f === "duplicate_image" || f === "geofence_fail" || f === "bad_bin_code");
}

export function flagReason(flags: FraudFlag[]): string {
  if (flags.includes("duplicate_image")) return "That photo was already used. Take a fresh one.";
  if (flags.includes("geofence_fail")) return "You're not close enough to this bin.";
  if (flags.includes("bad_bin_code")) return "That bin code is expired. Re-scan the QR on the bin.";
  return "Could not verify this return.";
}
