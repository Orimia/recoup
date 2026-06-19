# Real vs. simulated · honest accounting

This repo has two halves and the line between them matters. Share this with a reviewer or partner — being explicit about it is the most credibility-building thing we can do.

- **The live product** (`/join`, `/challenge`, `/leaderboard`, `/rewards`, `/admin`) is a **working application**. Real accounts, real persistence, real scoring, real aggregation.
- **The pitch layer** (`/`, `/dashboard`, `/ai`, `/simulator`, `/demo`) is **narrative + projections** built on seeded/computed data.

---

## Fully real (working software, not a mock)

- **Accounts & auth.** Signup/login with scrypt-hashed passwords and an HMAC-signed httpOnly session cookie. `@vanderbilt.edu`-gated, email-verified (required to redeem), with account lockout + per-IP rate limits. Try wrong-password, duplicate-handle, lockout, logged-out access — all enforced server-side (`src/lib/server/auth.ts`).
- **Anti-cheat verification.** Real, running code (`bincodes.ts`, `geo.ts`, `imagehash.ts`, `fraud.ts`): rotating HMAC bin codes, GPS geofence, duplicate-photo rejection, per-deposit trust score + flags, burst detection, and operator claw-back. See [security.md](security.md) for the threat model and the honest ceiling (true fraud-proofing needs bin hardware).
- **Persisted deposits.** Every logged return is written to a real store (`.data/db.json` via `src/lib/server/db.ts`) and survives restarts. The repository sits behind a typed interface — swapping in Postgres/SQLite is a `db.ts` change, nothing else.
- **Scoring, streaks, anti-farming.** Points, the once-per-day streak bonus, and a 20/day verified-return cap are real rules in `src/lib/challenge/points.ts`, applied on every deposit.
- **Leaderboard, bracket, team standings.** Computed live from the actual user/deposit rows (`src/lib/server/views.ts`). The 8-team single-elim bracket re-seeds from current points on every load; higher total advances.
- **Rewards & redemptions.** Redeeming checks your balance, debits points, records the redemption, and leaves lifetime points intact so standings hold. Insufficient balance returns HTTP 402.
- **Operator console (`/admin`).** Every number — total returns, verified count, contamination rate, active-today, per-bin volume, 14-day series, redemptions — is aggregated from real rows, auto-refreshing every 8s.
- **The entire UI.** Every screen is real React. No screenshots pretending to be interactive.

## Real *when configured* (one code path, two backends)

- **AI contamination classification.** With `ANTHROPIC_API_KEY` set, uploaded deposit photos are classified by **live Claude vision** (`src/lib/server/classify.ts`), with prompt caching. Without a key, the same path falls back to a labeled heuristic. The UI and admin console **honestly show which ran** (`Claude vision live` vs `Vision: simulated`). Nothing claims to be AI when it isn't.

## Seeded so the product isn't empty on day one

- **8 demo students + ~400 historical deposits.** Generated at first run so leaderboards/bracket/admin are populated before the first real signup. Demo handles start `demo_`. These are real rows in the store, not hardcoded totals — the admin analytics actually compute over them.
- **8 bins and 8 bracket teams.** The bins mirror the pitch fleet (Munchie Mart, Rand, Memorial Gym, FirstBank Stadium…). Teams carry a Vanderbilt-funded `baselinePoints` head-start so the bracket looks alive at launch; live member points accrue on top.
- **Reward catalog.** Realistic Vanderbilt-funded perks with point costs. Redemptions are real; fulfillment (actually handing over coffee) is out of scope for the prototype.

## Pitch layer — modeled, not measured

- **Impact math** (`src/lib/data/impact.ts`, `scenarios.ts`). Every dollar / ton CO₂e / can is computed from published constants (EPA aluminum emissions factor, LME spot, tipping fees). Auditable — hover any landing tile, or move a simulator slider, to see the formula. The *inputs* at scale are projections; the *arithmetic* is real.
- **Pitch dashboard & AI insights** (`/dashboard`, `/ai`). The four models (vision/ResNet-50, Thompson-sampling bandit, temporal-CNN forecast, behavior clustering) are **architectural claims** — standard, defensible choices we'd deploy — presented with plausible metrics. They are not training/serving in this build. The one model that *does* run live is the vision classifier on `/challenge` when a key is set.
- **Trends, experiments, halftime pulse.** Seeded to match documented patterns; not measured from a real deployment.

## Not built (out of scope, on purpose)

VandyID SSO, meal-money transfers, model-training pipelines, and the assembled bin hardware (its firmware + signed-event API are written; see `docs/hardware-verification.md`). These are the **Phase 3** items the landing page explicitly defers until the challenge has proven itself — that deferral is the strategy, not a gap. (Email verification *is* built and gates redemption.)

## How to explain it in one breath

> "The challenge is a working product — real accounts, real verified deposits, real points and leaderboards, computed live. The AI is real when we plug in a key, and the app tells you honestly when it's running the model versus the fallback. The big impact numbers are projections, but every one is computed from published constants you can inspect. We deliberately don't touch campus systems yet — we prove the behavior first."
