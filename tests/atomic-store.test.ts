// Proves the production Postgres integrity guarantees on a real Postgres engine
// (PGlite, in-memory). These are the guards behind the deposit/redemption/bin-event
// concurrency fixes: conditional debit, atomic increment, and insert-if-new dedup.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { createPgBackend, type Backend, type QueryFn } from "../src/lib/server/store-pg.ts";
import type { DB } from "../src/lib/server/types.ts";

let pg: PGlite;
let backend: Backend;

const seed = (): DB =>
  ({
    version: 1,
    users: [{ id: "u1", points: 100, lifetimePoints: 50, deposits: 0 }],
    teams: [{ id: "t1" }], // teams is the seed sentinel in store-pg init()
    bins: [],
    deposits: [],
    rewards: [],
    redemptions: [],
    stations: [],
  }) as unknown as DB;

before(async () => {
  pg = new PGlite();
  const query: QueryFn = async (text, params) => {
    const r = await pg.query(text, params as unknown[]);
    return { rows: r.rows as Array<Record<string, unknown>> };
  };
  backend = createPgBackend(query, seed, 1);
  await backend.loadDB(); // triggers schema creation + seeding
});

after(async () => {
  await pg.close();
});

test("spend debits only when the balance covers the cost (blocks double-spend)", async () => {
  assert.equal(await backend.spend("users", "u1", "points", 100), true); // 100 -> 0
  assert.equal(await backend.spend("users", "u1", "points", 100), false); // insufficient, no debit
  const db = await backend.loadDB();
  assert.equal(db.users.find((u) => u.id === "u1")?.points, 0);
});

test("bump applies atomic numeric increments plus field sets", async () => {
  await backend.bump("users", "u1", { points: 25, deposits: 1 }, { lastDepositDay: "2026-03-15" });
  const u = (await backend.loadDB()).users.find((x) => x.id === "u1");
  assert.equal(u?.points, 25); // 0 + 25
  assert.equal(u?.deposits, 1); // 0 + 1
  assert.equal(u?.lastDepositDay, "2026-03-15");
});

test("insertIfNew dedups on id so a retried event is recorded once", async () => {
  assert.equal(await backend.insertIfNew("deposits", "dep-evt-x", { id: "dep-evt-x", pointsAwarded: 10 }), true);
  assert.equal(await backend.insertIfNew("deposits", "dep-evt-x", { id: "dep-evt-x", pointsAwarded: 10 }), false);
  const db = await backend.loadDB();
  assert.equal(db.deposits.filter((d) => d.id === "dep-evt-x").length, 1);
});
