// Storage facade. One async, granular API used by the whole app; two backends
// behind it, chosen by env:
//   - FileStore (default, local): JSON file at .data/db.json, in-memory cache.
//   - PgStore (when POSTGRES_URL/DATABASE_URL is set): Postgres, row-level jsonb.
// Callers never know which is active.

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import type { Bin, DB, Deposit, Redemption, Reward, Station, Team, User } from "./types";
import { seedBins, seedDemoUsers, seedRewards, seedTeams } from "./seed";
import { dayKey } from "../challenge/points";
import { config } from "./config";
import { createPgBackend, type Backend, type Table } from "./store-pg";

const DATA_DIR = join(process.cwd(), ".data");
const DB_FILE = join(DATA_DIR, "db.json");
const DB_VERSION = 4;

export function newId(prefix = "id"): string {
  return `${prefix}-${randomUUID().slice(0, 12)}`;
}

// A real launch supplies its own bins/teams/rewards via VL_SEED_PATH (a JSON file
// with { bins, teams, rewards }). When present we seed those and start CLEAN — no
// demo users or deposits. Without it, we use the populated demo seed.
function loadCustomSeed(): { bins: Bin[]; teams: Team[]; rewards: Reward[] } | null {
  if (!config.seedPath) return null;
  try {
    const raw = JSON.parse(readFileSync(config.seedPath, "utf8"));
    if (!Array.isArray(raw.bins) || !Array.isArray(raw.teams) || !Array.isArray(raw.rewards)) {
      console.warn("[VandyLoop] VL_SEED_PATH must contain bins/teams/rewards arrays; using demo seed.");
      return null;
    }
    console.log(
      `[VandyLoop] Seeding from ${config.seedPath}: ${raw.bins.length} bins, ${raw.teams.length} teams, ${raw.rewards.length} rewards.`
    );
    return { bins: raw.bins, teams: raw.teams, rewards: raw.rewards };
  } catch {
    console.warn(`[VandyLoop] Could not read VL_SEED_PATH (${config.seedPath}); using demo seed.`);
    return null;
  }
}

function buildSeed(): DB {
  const custom = loadCustomSeed();
  const bins = custom?.bins ?? seedBins;
  const teams = custom?.teams ?? seedTeams;
  const rewards = custom?.rewards ?? seedRewards;

  // Real launch: clean slate, real students fill it in. Stations are registered
  // per real bin via POST /api/admin/stations, so none are seeded.
  if (custom) {
    return { version: DB_VERSION, users: [], teams, bins, deposits: [], rewards, redemptions: [], stations: [] };
  }

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const users: User[] = seedDemoUsers.map((u, i) => ({
    id: `seed-user-${i + 1}`,
    handle: u.handle,
    name: u.name,
    email: `${u.handle}@vanderbilt.edu`,
    passwordHash: "", // seed users never log in
    passwordSalt: "",
    teamId: u.teamId,
    points: Math.round(u.lifetimePoints * 0.4),
    lifetimePoints: u.lifetimePoints,
    deposits: u.deposits,
    streakDays: 1 + (i % 6),
    lastDepositDay: dayKey(now - (i % 3) * day),
    createdAt: now - (40 - i) * day,
    emailVerified: true,
    verifyToken: null,
    verifyExpires: null,
    failedLogins: 0,
    lockedUntil: null,
    consentAt: now - (40 - i) * day,
    // Link one demo user's tap identity so the station simulator works out of the box.
    nfcId: i === 0 ? "04DEMO0001" : null,
  }));

  // Synthesize real Deposit rows behind the demo users so admin analytics and
  // per-bin charts compute from actual records, not hand-typed totals.
  const deposits: Deposit[] = [];
  for (const u of users) {
    for (let d = 0; d < u.deposits; d++) {
      const bin = bins[(d + users.indexOf(u)) % bins.length];
      const contaminated = Math.random() < 0.062;
      const ts = now - Math.floor(Math.random() * 14) * day - Math.floor(Math.random() * day);
      deposits.push({
        id: randomUUID(),
        userId: u.id,
        binCode: bin.code,
        material: contaminated ? "contaminant" : "aluminum",
        confidence: contaminated ? 0.74 + Math.random() * 0.2 : 0.965 + Math.random() * 0.03,
        classifiedBy: "heuristic",
        contaminants: contaminated ? ["coffee cup"] : [],
        pointsAwarded: contaminated ? 0 : 10,
        note: contaminated ? "Flagged contaminant — no points" : "Verified aluminum",
        createdAt: ts,
        flags: [],
        trust: 1,
        imageHash: null,
        distanceM: null,
        voided: false,
      });
    }
  }
  deposits.sort((a, b) => b.createdAt - a.createdAt);

  // One demo station so the station simulator works locally with no setup.
  const stations: Station[] = [
    {
      id: "station-demo-mm01",
      name: "Munchie Mart · Main (demo)",
      binCode: "MM-01",
      secret: "demo-station-secret-key",
      createdAt: now,
    },
  ];

  return { version: DB_VERSION, users, teams, bins, deposits, rewards, redemptions: [], stations };
}

// ---- File backend ---------------------------------------------------------
function createFileBackend(): Backend {
  const gg = globalThis as unknown as { __vlFileDB?: DB };

  function load(): DB {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    if (existsSync(DB_FILE)) {
      try {
        const parsed = JSON.parse(readFileSync(DB_FILE, "utf8")) as DB;
        if (parsed && parsed.version === DB_VERSION) return parsed;
      } catch {
        // fall through to reseed on a corrupt/old file
      }
    }
    const fresh = buildSeed();
    persist(fresh);
    return fresh;
  }

  function persist(db: DB) {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${DB_FILE}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(db, null, 2));
    renameSync(tmp, DB_FILE); // atomic swap
  }

  function db(): DB {
    if (!gg.__vlFileDB) gg.__vlFileDB = load();
    return gg.__vlFileDB;
  }
  function rows(d: DB, t: Table): Array<{ id: string }> {
    return (d as unknown as Record<string, Array<{ id: string }>>)[t];
  }

  return {
    async loadDB() {
      return db();
    },
    async insert(t, id, obj) {
      const d = db();
      const arr = rows(d, t);
      const i = arr.findIndex((x) => x.id === id);
      if (i >= 0) arr[i] = obj as { id: string };
      else arr.push(obj as { id: string });
      persist(d);
    },
    async patch(t, id, partial) {
      const d = db();
      const row = rows(d, t).find((x) => x.id === id);
      if (row) Object.assign(row, partial);
      persist(d);
    },
  };
}

// ---- Backend selection ----------------------------------------------------
const g = globalThis as unknown as { __vlBackend?: Backend; __vlPgPool?: pg.Pool };

function backend(): Backend {
  if (!g.__vlBackend) {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (url) {
      const query = (text: string, params?: unknown[]) => {
        if (!g.__vlPgPool) {
          g.__vlPgPool = new pg.Pool({
            connectionString: url,
            ssl: { rejectUnauthorized: false },
            max: 3,
          });
        }
        return g.__vlPgPool.query(text, params as unknown[]);
      };
      g.__vlBackend = createPgBackend(query, buildSeed, DB_VERSION);
    } else {
      g.__vlBackend = createFileBackend();
    }
  }
  return g.__vlBackend;
}

// ---- Public async API (used everywhere) -----------------------------------
export function loadDB(): Promise<DB> {
  return backend().loadDB();
}
export function insertUser(u: User): Promise<void> {
  return backend().insert("users", u.id, u);
}
export function updateUser(id: string, partial: Partial<User>): Promise<void> {
  return backend().patch("users", id, partial);
}
export function insertDeposit(d: Deposit): Promise<void> {
  return backend().insert("deposits", d.id, d);
}
export function updateDeposit(id: string, partial: Partial<Deposit>): Promise<void> {
  return backend().patch("deposits", id, partial);
}
export function insertRedemption(r: Redemption): Promise<void> {
  return backend().insert("redemptions", r.id, r);
}
export function insertStation(s: Station): Promise<void> {
  return backend().insert("stations", s.id, s);
}
