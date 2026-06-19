// Central, env-driven configuration for auth + anti-cheat behavior.
// Everything has a safe default so the app runs with zero env set (demo mode),
// and tightens up as you set real values in production.

function bool(v: string | undefined, def: boolean): boolean {
  if (v === undefined) return def;
  return v === "1" || v.toLowerCase() === "true";
}
function num(v: string | undefined, def: number): number {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : def;
}

export const config = {
  // Identity
  allowedEmailDomains: (process.env.ALLOWED_EMAIL_DOMAINS || "vanderbilt.edu")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  // "*" in the list allows any domain (useful for open demos without a .edu)
  get allowAnyDomain() {
    return this.allowedEmailDomains.includes("*");
  },

  // Presence checks
  geofenceRadiusM: num(process.env.GEOFENCE_RADIUS_M, 150),
  binCodeWindowSec: num(process.env.BIN_CODE_WINDOW_SEC, 90),

  // Enforcement posture.
  // demo (default): record + flag violations, still award points (so a live demo
  //   never hard-fails), but unambiguous abuse (duplicate image) scores zero.
  // strict: hard-reject deposits that fail presence/act checks.
  strict: bool(process.env.STRICT_VERIFICATION, false),

  // Value gate: redeeming rewards requires a verified email (where value leaves).
  requireVerifiedForRedeem: bool(process.env.REQUIRE_VERIFIED_FOR_REDEEM, true),

  // Auth hardening
  maxFailedLogins: num(process.env.MAX_FAILED_LOGINS, 5),
  lockoutMinutes: num(process.env.LOCKOUT_MINUTES, 15),
  verifyTokenTtlHours: num(process.env.VERIFY_TOKEN_TTL_HOURS, 24),
  // IP rate limits are coarse on campus: a whole dorm sits behind one NAT IP, so
  // a launch event looks like one address. Keep these high; per-account lockout
  // and email verification are the real Sybil/brute-force controls.
  signupsPerIpPerHour: num(process.env.SIGNUPS_PER_IP_PER_HOUR, 40),
  loginsPerIpPer10Min: num(process.env.LOGINS_PER_IP_PER_10MIN, 50),

  // Anti-farming
  dailyDepositCap: num(process.env.DAILY_DEPOSIT_CAP, 20),
  duplicateImageWindowDays: num(process.env.DUPLICATE_IMAGE_WINDOW_DAYS, 14),

  // Admin: if set, admin actions (claw-back) require this key. Unset = open (demo).
  adminKey: process.env.ADMIN_KEY || "",

  // URLs + secrets
  appUrl: process.env.APP_URL || "http://localhost:3000",
  binCodeSecret: process.env.BIN_CODE_SECRET || process.env.SESSION_SECRET || "vandyloop-dev-bincode-secret",
  resendApiKey: process.env.RESEND_API_KEY || "",
  resendFrom: process.env.RESEND_FROM || "VandyLoop <onboarding@resend.dev>",

  // Optional JSON file of real bins/teams/rewards to seed (else the demo seed).
  seedPath: process.env.VL_SEED_PATH || "",
};

// Fail fast on an unsafe production launch. Called once at server start
// (src/instrumentation.ts), only when NODE_ENV=production.
export function assertProductionReady(): void {
  const fatal: string[] = [];
  const warn: string[] = [];

  if (!process.env.SESSION_SECRET) {
    fatal.push("SESSION_SECRET is not set — sessions and bin codes would use a public dev key.");
  }
  if (config.allowAnyDomain) {
    warn.push('ALLOWED_EMAIL_DOMAINS contains "*" — anyone can sign up. Set it to "vanderbilt.edu" for a real launch.');
  }
  if (!config.strict) {
    warn.push("STRICT_VERIFICATION is off — presence/act checks only flag, never reject. Set STRICT_VERIFICATION=true for a real launch.");
  }
  if (!config.adminKey) {
    warn.push("ADMIN_KEY is not set — the operator claw-back endpoint is open. Set ADMIN_KEY to lock it down.");
  }

  for (const w of warn) console.warn(`[VandyLoop] WARNING: ${w}`);
  if (fatal.length) {
    throw new Error(
      "[VandyLoop] Refusing to start in production:\n- " +
        fatal.join("\n- ") +
        "\nSet the required environment variables and redeploy."
    );
  }
}

export function emailDomainAllowed(email: string): boolean {
  if (config.allowAnyDomain) return true;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return config.allowedEmailDomains.some((d) => domain === d || domain.endsWith(`.${d}`));
}
