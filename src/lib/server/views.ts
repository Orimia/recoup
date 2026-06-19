// Read-model computations: turn the raw store into the shapes the UI consumes.
// All derived numbers (ranks, standings, bracket, admin analytics) live here so
// route handlers are thin and the math is testable in one place.

import { dayKey } from "../challenge/points";
import type { DB, Deposit, User } from "./types";

export type PublicUser = {
  id: string;
  handle: string;
  name: string;
  teamId: string;
  teamName: string;
  points: number;
  lifetimePoints: number;
  deposits: number;
  streakDays: number;
  emailVerified: boolean;
};

export function publicUser(u: User, db: DB): PublicUser {
  const team = db.teams.find((t) => t.id === u.teamId);
  return {
    id: u.id,
    handle: u.handle,
    name: u.name,
    teamId: u.teamId,
    teamName: team?.name ?? "—",
    points: u.points,
    lifetimePoints: u.lifetimePoints,
    deposits: u.deposits,
    streakDays: u.streakDays,
    emailVerified: u.emailVerified,
  };
}

export function userStats(u: User, db: DB) {
  const today = dayKey();
  const mine = db.deposits.filter((d) => d.userId === u.id);
  const todays = mine.filter((d) => dayKey(d.createdAt) === today);
  const ranked = [...db.users].sort((a, b) => b.lifetimePoints - a.lifetimePoints);
  const rankOverall = ranked.findIndex((x) => x.id === u.id) + 1;
  return {
    todayDeposits: todays.length,
    todayPoints: todays.reduce((s, d) => s + d.pointsAwarded, 0),
    rankOverall,
    totalStudents: db.users.length,
    recent: mine
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6)
      .map(depositView(db)),
  };
}

function depositView(db: DB) {
  return (d: Deposit) => ({
    id: d.id,
    binName: db.bins.find((b) => b.code === d.binCode)?.name ?? d.binCode,
    material: d.material,
    confidence: d.confidence,
    classifiedBy: d.classifiedBy,
    pointsAwarded: d.pointsAwarded,
    note: d.note,
    createdAt: d.createdAt,
    flags: d.flags ?? [],
    trust: d.trust ?? 1,
    voided: d.voided ?? false,
  });
}

export type TeamStanding = {
  id: string;
  name: string;
  type: "dorm" | "org";
  region: string;
  seed: number;
  members: number;
  points: number; // baseline + member lifetime points
  livePoints: number; // member contribution only
};

export function teamStandings(db: DB): TeamStanding[] {
  return db.teams
    .map((t) => {
      const members = db.users.filter((u) => u.teamId === t.id);
      const live = members.reduce((s, u) => s + u.lifetimePoints, 0);
      return {
        id: t.id,
        name: t.name,
        type: t.type,
        region: t.region,
        seed: t.seed,
        members: members.length,
        points: t.baselinePoints + live,
        livePoints: live,
      };
    })
    .sort((a, b) => b.points - a.points);
}

export type BracketMatch = {
  round: string;
  a: { name: string; points: number; seed: number } | null;
  b: { name: string; points: number; seed: number } | null;
  winner: "a" | "b" | null;
};

// 8-team single-elim seeded by current standings. Higher points advances.
export function bracket(db: DB): BracketMatch[][] {
  const standings = teamStandings(db).slice(0, 8);
  const cell = (i: number) =>
    standings[i]
      ? { name: standings[i].name, points: standings[i].points, seed: standings[i].seed }
      : null;

  // Seed 1v8, 4v5, 2v7, 3v6 (by current rank index)
  const order = [0, 7, 3, 4, 1, 6, 2, 5];
  const quarters: BracketMatch[] = [];
  for (let i = 0; i < order.length; i += 2) {
    const a = cell(order[i]);
    const b = cell(order[i + 1]);
    quarters.push({
      round: "Quarterfinal",
      a,
      b,
      winner: a && b ? (a.points >= b.points ? "a" : "b") : a ? "a" : b ? "b" : null,
    });
  }

  const advance = (m: BracketMatch) =>
    m.winner === "a" ? m.a : m.winner === "b" ? m.b : null;

  const semis: BracketMatch[] = [];
  for (let i = 0; i < quarters.length; i += 2) {
    const a = advance(quarters[i]);
    const b = advance(quarters[i + 1]);
    semis.push({
      round: "Semifinal",
      a,
      b,
      winner: a && b ? (a.points >= b.points ? "a" : "b") : a ? "a" : b ? "b" : null,
    });
  }

  const a = advance(semis[0]);
  const b = advance(semis[1]);
  const final: BracketMatch = {
    round: "Final",
    a,
    b,
    winner: a && b ? (a.points >= b.points ? "a" : "b") : a ? "a" : b ? "b" : null,
  };

  return [quarters, semis, [final]];
}

export function leaderboard(db: DB) {
  const individuals = [...db.users]
    .sort((a, b) => b.lifetimePoints - a.lifetimePoints)
    .slice(0, 12)
    .map((u, i) => ({
      rank: i + 1,
      handle: u.handle,
      name: u.name,
      teamName: db.teams.find((t) => t.id === u.teamId)?.name ?? "—",
      lifetimePoints: u.lifetimePoints,
      deposits: u.deposits,
      streakDays: u.streakDays,
    }));
  return { individuals, teams: teamStandings(db), bracket: bracket(db) };
}

export function adminStats(db: DB) {
  const deposits = db.deposits;
  const verified = deposits.filter((d) => d.material === "aluminum");
  const contaminant = deposits.filter((d) => d.material !== "aluminum");
  const contaminationRate = deposits.length ? contaminant.length / deposits.length : 0;

  const today = dayKey();
  const activeToday = new Set(
    deposits.filter((d) => dayKey(d.createdAt) === today).map((d) => d.userId)
  ).size;

  // Per-bin activity
  const perBin = db.bins.map((b) => {
    const rows = deposits.filter((d) => d.binCode === b.code);
    const cont = rows.filter((d) => d.material !== "aluminum").length;
    return {
      code: b.code,
      name: b.name,
      locationType: b.locationType,
      total: rows.length,
      contaminationRate: rows.length ? cont / rows.length : 0,
    };
  });

  // Last 14 days series
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const series: { day: string; label: string; deposits: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const key = dayKey(now - i * day);
    const label = new Date(now - i * day).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
    });
    series.push({
      day: key,
      label,
      deposits: deposits.filter((d) => dayKey(d.createdAt) === key).length,
    });
  }

  const withHandle = (d: Deposit) => ({
    ...depositView(db)(d),
    handle: db.users.find((u) => u.id === d.userId)?.handle ?? "—",
  });

  const recent = deposits
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8)
    .map(withHandle);

  // Integrity feed: deposits carrying fraud flags, most recent first.
  const flaggedDeposits = deposits.filter((d) => (d.flags?.length ?? 0) > 0 && !d.voided);
  const flagged = flaggedDeposits
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10)
    .map(withHandle);

  const verifiedUsers = db.users.filter((u) => u.emailVerified).length;

  return {
    totals: {
      students: db.users.length,
      verifiedUsers,
      deposits: deposits.length,
      verified: verified.length,
      contaminant: contaminant.length,
      contaminationRate,
      activeToday,
      pointsAwarded: deposits.reduce((s, d) => s + d.pointsAwarded, 0),
      redemptions: db.redemptions.length,
      aiClassified: deposits.filter((d) => d.classifiedBy === "ai").length,
      flagged: flaggedDeposits.length,
      voided: deposits.filter((d) => d.voided).length,
    },
    perBin,
    series,
    recent,
    flagged,
  };
}
