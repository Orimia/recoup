# Architecture & assumptions

## Stack choice

**Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + Recharts + Framer Motion.**

Why:
- Single-deploy, single-command dev, single-command build. No second service to stand up mid-demo.
- App Router means every page is a route — no client-side routing gymnastics and every page prerenders statically.
- Tailwind with custom tokens (`src/app/globals.css`) keeps the premium, polished look without a heavyweight design system.
- Recharts over d3 because the chart surface is small; every chart is a ~20-line component.
- Zustand over Context because we only needed one piece of cross-route state (the scale toggle).

Rejected alternatives:
- **Remix** — similar capability, smaller ecosystem for charts.
- **Vite + React Router** — would have needed a separate static server for deploy.
- **shadcn/ui** — too much boilerplate for five shared primitives (Card, Badge, Button, Progress, Stat).

## Two halves: live product + pitch layer

The app deliberately contains both a **working product** (the challenge) and a **pitch layer** (narrative + projections). They share design system and nav but have different data sources.

### Live product backend (`src/lib/server/`, `src/app/api/`)

Real, persisted, server-side. App Router Route Handlers on the Node runtime (`runtime = "nodejs"`, `dynamic = "force-dynamic"`).

| Concern | Implementation |
|---------|----------------|
| Persistence | `db.ts` — one granular async API (`loadDB`/`insert`/`patch`/`insertIfNew`/`bump`/`spend`/`voidDepositOnce`) over two interchangeable backends chosen by env: a file store (`.data/db.json`, local/dev) and **Postgres** (`store-pg.ts`, production on Neon). Point-affecting writes are atomic (conditional debit, insert-if-new, clamped increments) so they're correct under serverless concurrency. |
| Auth | `auth.ts` — `scrypt` password hashing, HMAC-signed httpOnly session cookie (`timingSafeEqual` compares). No external auth dependency. |
| Classification | `classify.ts` — live Claude vision via `fetch` (with prompt caching) when `ANTHROPIC_API_KEY` is set; labeled heuristic otherwise. 12s abort timeout; any failure falls back so a deposit never errors on the AI path. |
| Scoring | `challenge/points.ts` — pure functions for points, streak bonus, daily cap. Unit-testable, no I/O. |
| Read models | `views.ts` — leaderboard, team standings, bracket seeding, per-user stats, admin aggregates. All derived from raw rows so the math lives in one place. |

API surface: `auth/{signup,login,logout,verify,resend}`, `me`, `deposits`, `bin-events` (signed hardware deposits), `identity/link`, `bins`, `teams`, `leaderboard`, `rewards`, `redemptions`, `bin-code`, `health`, `admin/{stats,void,stations}`.

Client auth state is a small React context (`challenge/useAuth.tsx`) that hydrates from `/api/me` and is consumed by the nav and product pages.

### Two storage backends (file for dev, Postgres for production)

One repository interface, two backends selected by env (`POSTGRES_URL`/`DATABASE_URL`). **Local/dev:** a file store (`.data/db.json`) — zero native deps (no node-gyp under Next 16 + Turbopack), survives restarts, trivially inspectable (`cat .data/db.json`). **Production (live on Vercel):** Postgres on Neon, one row per record as jsonb. Callers only see the repository boundary, so the same code runs on both. Point-affecting mutations use atomic single-statement SQL (conditional debit, `ON CONFLICT DO NOTHING`, clamped increments) and identity has DB-level uniqueness, so the serverless/multi-instance concurrency a naive file store can't handle is handled correctly in production.

## Pitch-layer data flow

The narrative pages have no backend — data lives in `src/lib/data/`:

| File | Content |
|------|---------|
| `bins.ts` | 8 pilot bins with status, fill, contamination, uptime |
| `insights.ts` | 5 AI insights with reasoning, confidence, recommendation |
| `trends.ts` | 12 weeks historical + 3 weeks forecast · hourly + athletics pulse |
| `events.ts` | Seed events for live stream + student activity |
| `impact.ts` | Formula constants + impact bundle computation |
| `scenarios.ts` | Simulator input/output model |

The Simulator (`/simulator`) is the one page that does real math — `computeScenario()` is pure TypeScript, deterministic, and recomputes on every slider move via `useMemo`. Every other "live" number is a seeded value or a derived computation over the seed.

The event stream (`/components/ui/event-stream.tsx`) fakes live behavior with `setInterval` + `framer-motion` exit/enter — it's the only animated data source.

## State

- **Zustand store** (`src/lib/store.ts`) holds a `scale` toggle (`pilot | campus | network`) surfaced in the `ModeBanner`. Intentionally underused in this MVP — it's wired up for demo but most components ignore it. Can be driven harder in a later version without touching the data layer.
- **Route-local state** (useState) handles simulator inputs, demo step index, student flow step.

## Impact math — show your work

Every impact number on the app traces back to `IMPACT_CONSTANTS` in `src/lib/data/impact.ts`. Sources:

| Constant | Value | Source |
|----------|-------|--------|
| `canWeightG` | 14.9 | Industry mean empty Al can |
| `aluminumResaleUsdPerCan` | $0.0179 | LME spot × 0.95 recycled discount |
| `landfillCostAvoidedUsdPerCan` | $0.00049 | ~$50/ton tipping × 14.9g |
| `co2eKgPerCanRecycled` | 0.139 | EPA: 9.3 kgCO₂e/kg Al × 0.0149 kg |
| `energySavedKwhPerCan` | 0.26 | Aluminum Association recycling data |
| `esgReportingBaseUsd` | $12,000 | Mid-range CAA §609 benchmark |
| `haulerServiceTripUsd` | $215 | Vanderbilt facilities 2024 rate card (assumed) |

The simulator layers location-based traffic factors, a sigmoid reward-uplift curve, a sports-mode multiplier, and a contamination discount on top. ESG reporting value uses a log-scaled function capped at $250K to avoid the number going cartoonish at high campus counts.

## AI model framing

The app presents four "production" models in the AI Insights page:

1. **vision-contam/v3** — ResNet-50 fine-tuned on 14K labeled campus samples. Presented metric: 96.3% accuracy, 3.7% FPR.
2. **incentive-bandit/v2** — Thompson sampling bandit allocating reward variants. Presented metric: +22% first-return lift, 94% posterior win probability.
3. **fill-forecast/v1** — Temporal CNN predicting 72-hour fill curves. Presented metric: 6.4% MAE.
4. **behavior-segmenter/v2** — Temporal clustering identifying 4 student return-motivation cohorts.

None of these actually run in the app. They're architectural claims the product would make real at pilot scale. The numbers are *plausible* — defensible to a technical reviewer who knows the space — not measured. See `simulated-vs-real.md` for the honest accounting.

## Routing + navigation

Flat routing. Every page is a top-level route under `/src/app/`. Top nav is identical across routes. The scale banner (pilot / campus / network) is a visual constant but currently only affects the mode label.

## What we intentionally did NOT build

- **VandyID SSO / campus-system integration** — deliberately deferred to Phase 3. The whole strategy is to prove the loop *without* touching campus auth, PII, or money. The challenge uses its own accounts and its own points.
- **Real meal-money transfer** — rewards are funded by Vanderbilt and "issued" as records; no payment rail is wired.
- **The assembled physical bin** — the firmware and signed-event API are written and the spec + BOM are done (`firmware/`, `docs/hardware-verification.md`); building the hardware is the next milestone. Until then a rotating bin code stands in for the sensor event.
- **Model training pipeline** — the vision classifier *infers* via the Claude API; we don't train.
- **Password reset, multi-tenant org model, real-time WebSockets** — prototype scope. (Email verification *is* built and gates redemption.)

Rationale: these are the high-risk, high-effort items. Phase 1 (the live challenge) ships value and generates the dataset without any of them.

## What we'd add next, in phases

**Phase 1 (done — this build):** standalone challenge. Accounts, AI-verified deposits, points, bracket, rewards, live operator console.

**Phase 2 (in progress):**
1. Postgres swap behind the repository interface — **done** (live on Neon, atomic concurrency-safe writes, email verification, DB-level identity uniqueness).
2. The physical smart bin: assemble the sensor-fusion hardware behind the already-written firmware + signed-event API.
3. On-device or batched vision (ESP32 + tiny CNN, or server batch) to cut per-deposit API cost.
4. ESG reporting export (CDP, GRI, SASB templates) from the real deposit ledger.

**Phase 3 (optional, from evidence):**
5. VandyID SSO + meal-money rail integration — only once trust and ROI are demonstrated.
6. Hardware where it pencils out (high-traffic bins, athletics venues).

## Deployment

Live on Vercel with Postgres (Neon). It is a server app, not a static export: the API routes run on the Node runtime (`runtime = "nodejs"`, `dynamic = "force-dynamic"`) and persistence is Postgres. The pitch/marketing pages prerender; the product routes are dynamic.

```bash
npm run build
npm start          # Next.js runtime
```

**Production env:** `SESSION_SECRET` is required (the app refuses to boot without it — see `src/instrumentation.ts`), `POSTGRES_URL`/`DATABASE_URL` selects the Postgres backend, and `ANTHROPIC_API_KEY` / `RESEND_API_KEY` enable live vision + verification email. Full list in `.env.production.example`; step-by-step in [deploy.md](deploy.md).
