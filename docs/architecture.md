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
| Persistence | `db.ts` — file-backed JSON store (`.data/db.json`) behind `read()` / `mutate()`. Atomic writes (temp + rename), in-memory cache pinned to `globalThis` so dev HMR doesn't reset it. **Swappable**: re-implement `read`/`mutate` against Postgres/SQLite and nothing else changes. |
| Auth | `auth.ts` — `scrypt` password hashing, HMAC-signed httpOnly session cookie (`timingSafeEqual` compares). No external auth dependency. |
| Classification | `classify.ts` — live Claude vision via `fetch` (with prompt caching) when `ANTHROPIC_API_KEY` is set; labeled heuristic otherwise. 12s abort timeout; any failure falls back so a deposit never errors on the AI path. |
| Scoring | `challenge/points.ts` — pure functions for points, streak bonus, daily cap. Unit-testable, no I/O. |
| Read models | `views.ts` — leaderboard, team standings, bracket seeding, per-user stats, admin aggregates. All derived from raw rows so the math lives in one place. |

API surface: `auth/{signup,login,logout}`, `me`, `deposits`, `bins`, `teams`, `leaderboard`, `rewards`, `redemptions`, `admin/stats`.

Client auth state is a small React context (`challenge/useAuth.tsx`) that hydrates from `/api/me` and is consumed by the nav and product pages.

### Why a file-backed store (not SQLite/Postgres)

For a single-process pilot/demo it is the lowest-risk choice that is still *real* persistence: zero native deps (no node-gyp surprises under Next 16 + Turbopack), survives restarts, trivially inspectable (`cat .data/db.json`). The repository boundary means production is a swap, not a rewrite. Tradeoff: not safe for multi-process/serverless concurrency — fine here, documented for later.

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
- **Hardware / IoT firmware** — bin codes stand in for QR/sensor events.
- **Model training pipeline** — the vision classifier *infers* via the Claude API; we don't train.
- **Email verification, password reset, multi-tenant org model, real-time WebSockets** — prototype scope.

Rationale: these are the high-risk, high-effort items. Phase 1 (the live challenge) ships value and generates the dataset without any of them.

## What we'd add next, in phases

**Phase 1 (done — this build):** standalone challenge. Accounts, AI-verified deposits, points, bracket, rewards, live operator console.

**Phase 2 (proven):**
1. Postgres/SQLite swap behind the existing repository interface (`db.ts`).
2. On-device or batched vision (ESP32 + tiny CNN, or server batch) to cut per-deposit API cost.
3. ESG reporting export (CDP, GRI, SASB templates) from the real deposit ledger.
4. Email verification + abuse/fraud hardening beyond the daily cap.

**Phase 3 (optional, from evidence):**
5. VandyID SSO + meal-money rail integration — only once trust and ROI are demonstrated.
6. Hardware where it pencils out (high-traffic bins, athletics venues).

## Deployment

Fully static. `next build` produces a prerendered app deployable anywhere (Vercel, Netlify, Cloudflare Pages, or `next start` on any VM). No env vars required.

```bash
npm run build
npm start          # for the Next.js runtime
```

Or export + serve as pure static:
```bash
# Next 16 Turbopack supports `output: "export"` in next.config.ts if needed.
```
