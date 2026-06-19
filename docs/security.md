# Security & anti-cheat design

The hard problem in a recycle-to-earn product is not authentication. It's **proving a physical act happened** with software. Be honest about the ceiling: only the bin can truly confirm a can went in (that's what reverse-vending machines buy with hardware). So the goal is not "impossible to cheat." It is:

> **Make cheating cost more than the reward, make fraud detectable, and make it reversible.**

Three properties make that achievable here, and they're why launching with *our own points* (not meal money) is the safe wedge: points are **capped**, **reversible**, and carry **no cash-out**, so pilot fraud is bounded. The day this touches meal money, fraud becomes theft — which is exactly why integration is deferred (see the landing page strategy).

## Threat model (adversary: a student or ring farming points)

| # | Attack | Defense in this build |
|---|--------|------------------------|
| 1 | **Phantom deposit** (no can, no bin) | Rotating bin code + geofence + (optional) photo. A bare claim earns low trust and is flagged. |
| 2 | **Photo replay** (one can, submitted many times) | SHA-256 of image bytes; a hash seen in the last N days → `duplicate_image`, **zero points even in demo mode**. |
| 3 | **Internet/stock image** | AI vision classifier (when keyed) + dedupe + presence checks. Raises cost; pHash upgrade noted below. |
| 4 | **Shared QR code** (post the sticker online) | Bin code is a **rotating HMAC** (90s window). A screenshot is useless minutes later. |
| 5 | **Multi-accounting / Sybil** | Email verification gated to `@vanderbilt.edu` (one account per real mailbox); SSO is the Phase-3 end state. Signup rate-limited per IP. |
| 6 | **Remote logging** (log from your dorm) | GPS geofence (haversine vs. bin coordinates, 150m default). Absent/failed location → flagged. |
| 7 | **Brute-force / credential stuffing** | Per-account lockout (5 fails → 15 min) + per-IP rate limit on login. |
| 8 | **API abuse** (skip the UI) | All scoring is server-authoritative; daily cap (20 verified/day); burst detection (6/min → `rate_burst`). |
| 9 | **Anything that slips through** | Every deposit carries `flags[]` + a `trust` score; operators void fraudulent deposits → points clawed back (reversible). |

## The layers (defense in depth)

**1. Identity — `src/lib/server/{auth,email,config}.ts`**
- scrypt-hashed passwords, HMAC-signed httpOnly session cookie.
- `@vanderbilt.edu` enforced at signup (`ALLOWED_EMAIL_DOMAINS`, `*` to open signup to anyone).
- Email verification token (24h). **Redemption requires a verified email** — the one gate where value leaves.
- Lockout + IP rate limits on signup/login.
- *Phase 3:* Vanderbilt SSO (OIDC/SAML) for true one-account-per-student.

**2. Presence — `bincodes.ts`, `geo.ts`**
- **Rotating bin code:** `code = trunc6(HMAC(secret, "binCode:timeWindow"))`, 90s window, ±1 skew tolerance. The QR on the bin shows the current code; a deposit must present a currently-valid one. In **strict** mode the `/api/bin-code` endpoint withholds the code (it must be read off the physical QR), so it can't be harvested remotely; in demo mode it's exposed for convenience.
- **Presence requirement:** in strict mode a deposit is rejected unless presence is positively proven by a valid code **or** an in-geofence location — absence of both is a hard fail, not a soft flag.
- **Geofence:** device GPS must be within `GEOFENCE_RADIUS_M` of the bin's coordinates.

**3. Act — `classify.ts`, `imagehash.ts`**
- AI vision classification (live Claude when `ANTHROPIC_API_KEY` is set; labeled heuristic otherwise — the UI says which).
- Byte-hash replay defense. *Upgrade:* perceptual hash (pHash/aHash over decoded pixels) to catch re-encoded/cropped reuse; needs an image decoder, deliberately out of scope for v1.

**4. Audit & ground truth — `fraud.ts`, `views.ts`, `/admin`, `/api/admin/void`**
- Composite `trust` per deposit; `flags[]` surfaced in the operator console.
- **Claw-back:** void a deposit → points reversed on the user (lifetime + balance).
- Daily cap + burst detection.
- *The killer reconciliation (Phase 2):* weigh the aluminum actually collected from each bin at hauling, compare to the sum of claimed deposits, and down-weight bins whose claims exceed reality. The hauler already empties the bin; you just add a scale. This anchors the whole economy to physical ground truth, cheaply.

## Enforcement posture

`STRICT_VERIFICATION` (env):
- **demo (default):** record + flag violations, still award points so a live demo never hard-fails — except `duplicate_image`, which always scores zero. Trust + flags are visible.
- **strict (production):** hard-reject deposits failing presence/act checks (HTTP 422).

This lets you demo a smooth flow while the integrity machinery runs visibly, then flip one env var to lock it down for a real pilot.

## What's still not bulletproof (honest list)

- GPS is spoofable on rooted devices; byte-hash misses re-encoded images; a determined ring with real cans at a real bin can still over-log up to the daily cap. These are **bounded** (caps + reversible points + reconciliation) rather than eliminated.
- The truly fraud-proof endpoint is **smart-bin hardware** (weight cell + IR/vision count), added in Phase 3 only where reward value justifies the ~$30–60/bin cost. That's reverse-vending-grade verification without the $15–30k machine.

## Production hardening checklist

- [ ] Set `SESSION_SECRET`, `BIN_CODE_SECRET`, `ADMIN_KEY` to strong random values.
- [ ] Set `ANTHROPIC_API_KEY` (live vision) and `RESEND_API_KEY` (real verification email).
- [ ] `STRICT_VERIFICATION=true`, confirm `REQUIRE_VERIFIED_FOR_REDEEM=true`.
- [ ] Move rate-limit + dedupe state to Redis/Upstash for multi-instance deploys.
- [x] `/admin` + all admin APIs (stats, claw-back, station registration) gated by `ADMIN_KEY` — the console prompts for the operator key and stores it per-device. (Full SSO/operator accounts is a later upgrade.)
- [ ] Add SSO when Vanderbilt IT registers the app.
