// Validates the exact SQL used by store-pg.ts against a real Postgres engine
// (PGlite, in-process WASM). Run: node scripts/validate-pg.mjs
// This catches jsonb / merge / upsert mistakes locally, before Neon/Vercel.

import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const q = (text, params) => db.query(text, params);
let failures = 0;
function check(name, cond) {
  console.log(`${cond ? "  ✓" : "  ✗"} ${name}`);
  if (!cond) failures++;
}

// 1. schema (same as createPgBackend.init)
await q(`CREATE TABLE IF NOT EXISTS users (id text PRIMARY KEY, data jsonb NOT NULL)`);

// 2. seed-style insert with ON CONFLICT DO NOTHING
const seed = { id: "u1", handle: "alice", points: 0, lifetimePoints: 0, emailVerified: false };
await q(`INSERT INTO users(id, data) VALUES($1, $2::jsonb) ON CONFLICT(id) DO NOTHING`, ["u1", JSON.stringify(seed)]);
await q(`INSERT INTO users(id, data) VALUES($1, $2::jsonb) ON CONFLICT(id) DO NOTHING`, ["u1", JSON.stringify({ id: "u1", handle: "SHOULD_NOT_OVERWRITE" })]);
let { rows } = await q(`SELECT data FROM users WHERE id=$1`, ["u1"]);
check("seed insert + DO NOTHING keeps original", rows[0].data.handle === "alice");

// 3. partial update via jsonb merge (the patch() path)
await q(`UPDATE users SET data = data || $2::jsonb WHERE id = $1`, ["u1", JSON.stringify({ points: 15, streakDays: 1 })]);
({ rows } = await q(`SELECT data FROM users WHERE id=$1`, ["u1"]));
check("merge sets new key (points=15)", rows[0].data.points === 15);
check("merge preserves untouched key (handle=alice)", rows[0].data.handle === "alice");
check("merge preserves untouched key (lifetimePoints=0)", rows[0].data.lifetimePoints === 0);
check("merge adds new field (streakDays=1)", rows[0].data.streakDays === 1);

// 4. merge can set null (e.g. lockedUntil: null, verifyToken: null)
await q(`UPDATE users SET data = data || $2::jsonb WHERE id = $1`, ["u1", JSON.stringify({ lockedUntil: null, emailVerified: true })]);
({ rows } = await q(`SELECT data FROM users WHERE id=$1`, ["u1"]));
check("merge sets null value", rows[0].data.lockedUntil === null);
check("merge flips boolean (emailVerified=true)", rows[0].data.emailVerified === true);

// 5. upsert replace (the insert() path = DO UPDATE SET data=$2)
await q(`INSERT INTO users(id, data) VALUES($1, $2::jsonb) ON CONFLICT(id) DO UPDATE SET data = $2::jsonb`, ["u1", JSON.stringify({ id: "u1", handle: "bob", points: 99 })]);
({ rows } = await q(`SELECT data FROM users WHERE id=$1`, ["u1"]));
check("upsert replaces whole doc (handle=bob)", rows[0].data.handle === "bob");
check("upsert drops old keys (streakDays gone)", rows[0].data.streakDays === undefined);

// 6. count sentinel (seed-empty check)
await q(`CREATE TABLE IF NOT EXISTS teams (id text PRIMARY KEY, data jsonb NOT NULL)`);
const { rows: c } = await q(`SELECT count(*)::int AS n FROM teams`);
check("count on empty table = 0", Number(c[0].n) === 0);

// 7. array fields round-trip (deposits have flags[], contaminants[])
await q(`CREATE TABLE IF NOT EXISTS deposits (id text PRIMARY KEY, data jsonb NOT NULL)`);
await q(`INSERT INTO deposits(id, data) VALUES($1, $2::jsonb)`, ["d1", JSON.stringify({ id: "d1", flags: ["geofence_fail", "no_photo"], trust: 0.55 })]);
({ rows } = await q(`SELECT data FROM deposits WHERE id=$1`, ["d1"]));
check("array field round-trips", Array.isArray(rows[0].data.flags) && rows[0].data.flags.length === 2);

console.log(failures === 0 ? "\nALL SQL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
