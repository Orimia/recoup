# Recoup / VandyLoop

[![CI](https://github.com/Orimia/recoup/actions/workflows/ci.yml/badge.svg)](https://github.com/Orimia/recoup/actions/workflows/ci.yml)

Verified recycle-to-reward for universities. Students earn instant rewards for recycling that is actually verified, and the school gets clean, can-by-can data it can act on.

**Live demo: https://vandyloop.vercel.app** (sign up, log a return, watch it flow through verification, reward, and the operator dashboard)

VandyLoop is the Vanderbilt pilot of Recoup. It is being built for a 60-day pilot at Vanderbilt's Munchie Mart, starting with aluminum cans, run like a March Madness style recycling challenge.

## The idea

Recycling on campus is a behavior and measurement problem, not an infrastructure problem. The bins already exist. What is missing is participation, accountability, and verified data. Recoup adds a closed loop on top of existing infrastructure:

> identify the student, verify the material, log a verified event, issue a reward, update the operator dashboard, optimize.

The defensible asset is not the bin. It is a standardized dataset of verified, attributable recycling events, plus the optimization layer on top of it.

## What is real today (and what is next)

Being honest about this matters, so:

- **Real and live:** the full software system, on a real database. Accounts, the verified-event ledger, the reward engine (points, streaks, daily caps, a dorm-vs-dorm bracket, rewards + redemptions), the operator dashboard (returns, participation, contamination proxy, CO2e/energy estimates, per-bin activity, fraud review with point claw-back), and anti-fraud (rate limits, lockout, duplicate detection, per-event trust scores).
- **Real, hardware-ready:** a signed bin-event API, identity linking for a tap token, a station simulator, the ESP32 bin firmware, and a full hardware spec + bill of materials.
- **Next, not faked:** the physical bin and the AI layer. The principle is trusted data first, AI second.

Where the line falls is documented in [docs/simulated-vs-real.md](docs/simulated-vs-real.md).

## The verification moat (the bin)

Trust comes from the bin, not from photos, which are easy to fake. A return counts only when cheap sensors agree, the bin signs the event, and collected aluminum is reconciled by weight at pickup:

- tap a token for identity, then at the chute: inductive (metal), Hall (non-ferrous, so aluminum), load cell (about 15 g, an empty can not a full one or trash), IR beam (one object, falling, cannot be faked or pulled back)
- a one-way baffle so a can cannot be re-scanned
- the bin signs each event with its own secret key, so deposits cannot be forged from a phone

Full design, BOM (~$60 to $90 in electronics per bin), firmware state machine, and the signed event contract are in [docs/hardware-verification.md](docs/hardware-verification.md). The firmware is in [firmware/](firmware/).

## Tech

- Next.js 16 (App Router), TypeScript, Tailwind, deployed on Vercel
- Postgres in production (jsonb-per-row store behind a swappable interface), local JSON store for dev
- Auth: scrypt-hashed passwords + HMAC-signed sessions, email verification
- Bin events: HMAC-signed, replay-protected
- ESP32 firmware in C++ (Arduino), HMAC-signed events matching the server

## Run it locally

```bash
npm install
npm run dev      # http://localhost:3000, seeds itself with demo data
```

No keys required to run. Add `ANTHROPIC_API_KEY` to enable live Claude vision classification, otherwise it uses a labeled heuristic. See [.env.production.example](.env.production.example) for all options and [docs/deploy.md](docs/deploy.md) to deploy.

### Testing

```bash
npm test    # scoring, HMAC bin events, geofence, anti-fraud, + a Postgres test
            # proving point mutations are concurrency-safe (no double-spend)
```

CI (GitHub Actions) runs lint, tests, and a production build on every push.

## Docs

- [docs/hardware-verification.md](docs/hardware-verification.md) — the smart-bin spec
- [docs/security.md](docs/security.md) — threat model and anti-cheat
- [docs/architecture.md](docs/architecture.md) — stack and data flow
- [docs/simulated-vs-real.md](docs/simulated-vs-real.md) — what is real vs modeled
- [docs/demo-script.md](docs/demo-script.md) — a 90-second walkthrough
- [docs/deploy.md](docs/deploy.md) — deployment

## Status

Software is built and live. Next milestone: the first physical bin, then a measured 60-day pilot. AI comes after the bins generate real verified data.
