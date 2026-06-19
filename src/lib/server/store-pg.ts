// Postgres backend for the store. One table per collection, each row is
// (id text PRIMARY KEY, data jsonb). The jsonb `data` IS the typed object, so
// there's no column mapping to drift, partial updates are a jsonb merge (`||`),
// and writes are row-level (concurrency-safe, no whole-document rewrite).
//
// It's parameterized by a `query(text, params)` runner so the exact same SQL can
// run against node-postgres (Neon/Vercel in prod) and PGlite (local validation).

import type { DB } from "./types";

export type Table = "users" | "teams" | "bins" | "deposits" | "rewards" | "redemptions" | "stations";
export const TABLES: Table[] = ["users", "teams", "bins", "deposits", "rewards", "redemptions", "stations"];

export type QueryFn = (text: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;

export type Backend = {
  loadDB(): Promise<DB>;
  insert(table: Table, id: string, obj: unknown): Promise<void>;
  patch(table: Table, id: string, partial: Record<string, unknown>): Promise<void>;
};

export function createPgBackend(query: QueryFn, buildSeed: () => DB, version: number): Backend {
  let ready: Promise<void> | null = null;

  // Batch-insert rows in one multi-row statement (chunked) to minimize round trips.
  async function batchInsert(table: Table, list: Array<{ id?: string; code?: string }>) {
    const CHUNK = 500;
    for (let i = 0; i < list.length; i += CHUNK) {
      const chunk = list.slice(i, i + CHUNK);
      const values: string[] = [];
      const params: unknown[] = [];
      chunk.forEach((row, j) => {
        const id = (row.id ?? row.code) as string;
        values.push(`($${j * 2 + 1}, $${j * 2 + 2}::jsonb)`);
        params.push(id, JSON.stringify(row));
      });
      await query(
        `INSERT INTO ${table}(id, data) VALUES ${values.join(", ")} ON CONFLICT(id) DO NOTHING`,
        params
      );
    }
  }

  async function init(): Promise<void> {
    for (const t of TABLES) {
      await query(`CREATE TABLE IF NOT EXISTS ${t} (id text PRIMARY KEY, data jsonb NOT NULL)`);
    }
    const { rows } = await query(`SELECT count(*)::int AS n FROM teams`);
    if (Number((rows[0] as { n: number }).n) > 0) return; // already seeded

    // Seed everything EXCEPT teams first, then teams last. `teams` is the
    // emptiness sentinel, so if seeding is interrupted, teams stays empty and the
    // whole seed re-runs cleanly next boot (ON CONFLICT DO NOTHING avoids dupes).
    const seed = buildSeed();
    await batchInsert("bins", seed.bins as Array<{ code: string }>);
    await batchInsert("rewards", seed.rewards);
    await batchInsert("stations", seed.stations);
    await batchInsert("users", seed.users);
    await batchInsert("deposits", seed.deposits);
    await batchInsert("redemptions", seed.redemptions);
    await batchInsert("teams", seed.teams);
  }

  function ensure(): Promise<void> {
    if (!ready) ready = init();
    return ready;
  }

  return {
    async loadDB(): Promise<DB> {
      await ensure();
      const out = { version } as unknown as DB;
      for (const t of TABLES) {
        const { rows } = await query(`SELECT data FROM ${t}`);
        // jsonb comes back already parsed by the driver
        (out as unknown as Record<string, unknown[]>)[t] = rows.map((r) => r.data);
      }
      return out;
    },
    async insert(table, id, obj) {
      await ensure();
      await query(
        `INSERT INTO ${table}(id, data) VALUES($1, $2::jsonb) ON CONFLICT(id) DO UPDATE SET data = $2::jsonb`,
        [id, JSON.stringify(obj)]
      );
    },
    async patch(table, id, partial) {
      await ensure();
      await query(`UPDATE ${table} SET data = data || $2::jsonb WHERE id = $1`, [
        id,
        JSON.stringify(partial),
      ]);
    },
  };
}
