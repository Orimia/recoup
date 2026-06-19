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
  /** Insert only if `id` is new. Returns true if a row was created, false if it
   *  already existed. Atomic dedup — the single guard for idempotent events. */
  insertIfNew(table: Table, id: string, obj: unknown): Promise<boolean>;
  /** Atomically add `deltas` to numeric fields (and optionally set `set` fields)
   *  in one statement, so concurrent writers can't lose updates. */
  bump(table: Table, id: string, deltas: Record<string, number>, set?: Record<string, unknown>): Promise<void>;
  /** Atomically subtract `amount` from a numeric field only if it stays >= 0.
   *  Returns true if debited, false if the balance was insufficient (or row gone).
   *  This is the anti-double-spend guard. */
  spend(table: Table, id: string, field: string, amount: number): Promise<boolean>;
  /** Atomically void a deposit exactly once: flip voided→true and zero its points,
   *  but only if it wasn't already voided. Returns the points to reverse (the old
   *  pointsAwarded) or null if it was already voided / missing. Prevents double
   *  claw-back from concurrent void requests. */
  voidDepositOnce(id: string): Promise<number | null>;
};

// Field/column names passed to bump()/spend() are always code-controlled
// constants (e.g. "points"), never user input, so interpolating them into SQL
// is safe. Values are always parameterized.
const FIELD_RE = /^[a-zA-Z][a-zA-Z0-9_]*$/;
function safeField(name: string): string {
  if (!FIELD_RE.test(name)) throw new Error(`unsafe field name: ${name}`);
  return name;
}

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
    // Identity uniqueness enforced at the database, so concurrent signups / card
    // links can't race past the app-level checks (one mailbox = one account; one
    // card = one account). Created best-effort: if legacy duplicates already exist
    // an index won't build, but the app still runs on the app-level checks.
    const indexes = [
      `CREATE UNIQUE INDEX IF NOT EXISTS users_email_uniq ON users ((lower(data->>'email')))`,
      `CREATE UNIQUE INDEX IF NOT EXISTS users_handle_uniq ON users ((lower(data->>'handle')))`,
      `CREATE UNIQUE INDEX IF NOT EXISTS users_nfcid_uniq ON users ((data->>'nfcId')) WHERE (data->>'nfcId') IS NOT NULL`,
    ];
    for (const sql of indexes) {
      try {
        await query(sql);
      } catch (e) {
        console.warn(`[VandyLoop] uniqueness index skipped: ${(e as Error).message}`);
      }
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
    async insertIfNew(table, id, obj) {
      await ensure();
      const { rows } = await query(
        `INSERT INTO ${table}(id, data) VALUES($1, $2::jsonb) ON CONFLICT(id) DO NOTHING RETURNING id`,
        [id, JSON.stringify(obj)]
      );
      return rows.length === 1;
    },
    async bump(table, id, deltas, set) {
      await ensure();
      const keys = Object.keys(deltas);
      if (keys.length === 0 && !(set && Object.keys(set).length)) return;
      // Increments are evaluated against the current row inside the UPDATE, so two
      // concurrent bumps both apply (no read-modify-write race).
      // GREATEST(0, ...) clamps at zero so a negative delta (a claw-back) can never
      // drive a counter below zero. Positive deltas (awards) are unaffected.
      const incr = keys
        .map((k, i) => `'${safeField(k)}', GREATEST(0, COALESCE((data->>'${safeField(k)}')::numeric, 0) + $${i + 2})`)
        .join(", ");
      const params: unknown[] = [id, ...keys.map((k) => deltas[k])];
      let expr = "data";
      if (incr) expr += ` || jsonb_build_object(${incr})`;
      if (set && Object.keys(set).length) {
        expr += ` || $${keys.length + 2}::jsonb`;
        params.push(JSON.stringify(set));
      }
      await query(`UPDATE ${table} SET data = ${expr} WHERE id = $1`, params);
    },
    async spend(table, id, field, amount) {
      await ensure();
      const f = safeField(field);
      // Debit and the balance check are one statement under a row lock, so two
      // concurrent spends can't both pass — the second sees the debited balance.
      const { rows } = await query(
        `UPDATE ${table}
            SET data = data || jsonb_build_object('${f}', ((data->>'${f}')::numeric - $2))
          WHERE id = $1 AND (data->>'${f}')::numeric >= $2
          RETURNING id`,
        [id, amount]
      );
      return rows.length === 1;
    },
    async voidDepositOnce(id) {
      await ensure();
      // FOR UPDATE locks the row; the WHERE guard means only the first of any
      // concurrent voids matches, so the points are reversed exactly once. The
      // CTE captures the pre-void pointsAwarded (the UPDATE then zeroes it).
      const { rows } = await query(
        `WITH target AS (
           SELECT id, COALESCE((data->>'pointsAwarded')::numeric, 0) AS pts
             FROM deposits
            WHERE id = $1 AND COALESCE((data->>'voided')::boolean, false) = false
            FOR UPDATE
         )
         UPDATE deposits d
            SET data = d.data || jsonb_build_object('voided', true, 'pointsAwarded', 0)
           FROM target
          WHERE d.id = target.id
          RETURNING target.pts AS reversed`,
        [id]
      );
      return rows.length ? Number((rows[0] as { reversed: number }).reversed) : null;
    },
  };
}
