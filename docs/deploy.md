# Deployment

There are two honest paths. Pick based on how soon you need it live vs. how much scale you want.

## TL;DR

- **Fastest real deploy (works today, zero code change):** a single persistent Node host — Render, Railway, or Fly.io — with a mounted volume for `.data/`. The file store persists fine on one long-running instance.
- **Vercel (what you asked about):** Vercel is serverless, so the local file store does **not** persist (read-only/ephemeral disk, per-instance). You must first swap persistence to a hosted DB. The repository is built behind one interface (`src/lib/server/db.ts`) so this is an adapter, not a rewrite. Recommended target: **Neon Postgres**.

## Path A — Render / Railway / Fly (recommended for the pilot)

The app already runs as `next build && next start`. On a single instance with a volume mounted at the project root (so `.data/` survives restarts), nothing else changes.

Render example:
1. New Web Service → connect the private repo.
2. Build: `npm install && npm run build`. Start: `npm start`.
3. Add a **Disk** mounted at `/opt/render/project/src/.data` (1GB is plenty).
4. Set env vars (see table). Deploy.

This is genuinely production-adequate for a 60-day single-campus pilot: one instance, real persistence, real auth, real anti-cheat.

## Path B — Vercel (needs the persistence swap first)

1. **Implement the Postgres adapter.** Reimplement `read()`/`mutate()` (or, better, add granular methods) in `src/lib/server/db.ts` against Postgres. Provision **Neon** (Vercel → Storage → Postgres, or neon.tech) and set `DATABASE_URL`. Keep the file store as the local-dev fallback when `DATABASE_URL` is unset.
   - Driver: `postgres` (porsager) or `@neondatabase/serverless`. Note: data access becomes **async**, so `read()` callers in the route handlers/`views.ts` need `await`. This is the one real refactor.
2. **Connect the repo** in Vercel and set env vars.
3. **Deploy.** Route handlers are already `runtime = "nodejs"` and `dynamic = "force-dynamic"`, so they run as serverless functions correctly.

> Alternative low-effort serverless store: **Vercel KV (Upstash Redis)** holding the whole DB JSON object — closest to the current model — but whole-object writes race under concurrency, so use row-level Postgres if you expect simultaneous deposits.

## Push to a private repo

```bash
# from the project root, already a git repo on `main`
gh repo create Orimia/vandyloop --private --source . --remote origin --push
```

`.env*` and `/.data/` are gitignored, so no secrets or local data are committed.

## Environment variables

| Var | Default | Purpose |
|-----|---------|---------|
| `SESSION_SECRET` | dev value | **Set in prod.** Signs session cookies. |
| `BIN_CODE_SECRET` | falls back to SESSION_SECRET | HMAC key for rotating bin codes. |
| `ADMIN_KEY` | unset (open) | If set, `/api/admin/void` requires `x-admin-key`. |
| `ANTHROPIC_API_KEY` | unset | Enables **live** Claude vision classification. |
| `VL_VISION_MODEL` | `claude-haiku-4-5-20251001` | Vision model id. |
| `RESEND_API_KEY` | unset | Sends real verification emails (else dev console link). |
| `RESEND_FROM` | `onboarding@resend.dev` | From address for verification email. |
| `APP_URL` | `http://localhost:3000` | Base URL for verification links. |
| `ALLOWED_EMAIL_DOMAINS` | `vanderbilt.edu` | Comma list; `*` allows any (open demos). |
| `STRICT_VERIFICATION` | `false` | `true` = hard-reject deposits failing presence/act checks. |
| `REQUIRE_VERIFIED_FOR_REDEEM` | `true` | Require verified email to redeem. |
| `GEOFENCE_RADIUS_M` | `150` | Geofence radius in meters. |
| `BIN_CODE_WINDOW_SEC` | `90` | Rotating-code lifetime. |
| `DAILY_DEPOSIT_CAP` | `20` | Counted verified returns per user per day. |
| `SIGNUPS_PER_IP_PER_HOUR` | `40` | Signup flood cap per IP (high: campus NAT shares one IP). |
| `LOGINS_PER_IP_PER_10MIN` | `50` | Login flood cap per IP. |
| `DATABASE_URL` | unset | (Path B) hosted Postgres connection string. |

## Production checklist

See the checklist at the bottom of [security.md](security.md) before going live with real students.
