// Domain model for the VandyLoop Challenge — the real, persisted product.
// These are the records the app actually reads and writes (not the pitch-page mock data).

export type Material = "aluminum" | "contaminant" | "other";
export type ClassifiedBy = "ai" | "heuristic" | "sensor";

export type Team = {
  id: string;
  name: string;
  type: "dorm" | "org";
  region: string; // March Madness bracket region
  seed: number; // 1–4 within region
  baselinePoints: number; // funded head-start so the bracket looks alive on day 1
};

export type User = {
  id: string;
  handle: string; // unique, lowercased
  name: string;
  email: string; // vanderbilt.edu enforced at signup
  passwordHash: string;
  passwordSalt: string;
  teamId: string;
  points: number; // redeemable balance
  lifetimePoints: number; // never decremented — drives leaderboard
  deposits: number;
  streakDays: number;
  lastDepositDay: string | null; // YYYY-MM-DD (local)
  createdAt: number;
  // Identity / anti-Sybil
  emailVerified: boolean;
  verifyToken: string | null;
  verifyExpires: number | null;
  // Auth hardening (brute-force lockout)
  failedLogins: number;
  lockedUntil: number | null;
  // Pilot consent (accepted terms + privacy at signup)
  consentAt: number | null;
  // Linked physical-tap identity (VandyID card UID / wallet token), set once via
  // /api/identity/link. Lets a bin attribute a deposit to this account.
  nfcId: string | null;
};

// A registered physical bin/station. Holds a symmetric secret used to HMAC-sign
// the events it reports. Provisioned via POST /api/admin/stations.
export type Station = {
  id: string;
  name: string;
  binCode: string; // which bin this station is mounted on
  secret: string; // shared HMAC key (firmware is provisioned with the same value)
  createdAt: number;
};

export type Bin = {
  code: string; // what a student scans / types (the QR target)
  name: string;
  locationType: "retail" | "dining" | "athletics" | "residence" | "academic";
  lat: number; // bin location for geofencing
  lng: number;
};

export type FraudFlag =
  | "no_photo"
  | "location_unverified"
  | "geofence_fail"
  | "bad_bin_code"
  | "duplicate_image"
  | "rate_burst";

export type Deposit = {
  id: string;
  userId: string;
  binCode: string;
  material: Material;
  confidence: number; // 0–1
  classifiedBy: ClassifiedBy;
  contaminants: string[]; // e.g. ["coffee cup", "residual liquid"]
  pointsAwarded: number;
  note: string;
  createdAt: number;
  // Integrity
  flags: FraudFlag[];
  trust: number; // 0–1 composite confidence the deposit is genuine
  imageHash: string | null; // sha256 of photo bytes (replay defense)
  distanceM: number | null; // device distance from bin, if provided
  voided: boolean; // set true on claw-back; points already reversed
  // Provenance: "app" = phone self-report (soft trust), "station" = signed bin event (hard trust)
  source?: "app" | "station";
  stationId?: string | null;
  eventId?: string | null; // station event id, for idempotent replay protection
};

export type Reward = {
  id: string;
  name: string;
  cost: number; // points
  description: string;
  sponsor: string;
};

export type Redemption = {
  id: string;
  userId: string;
  rewardId: string;
  rewardName: string;
  cost: number;
  status: "issued";
  createdAt: number;
};

export type DB = {
  version: number;
  users: User[];
  teams: Team[];
  bins: Bin[];
  deposits: Deposit[];
  rewards: Reward[];
  redemptions: Redemption[];
  stations: Station[];
};
