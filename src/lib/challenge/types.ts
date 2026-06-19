// Client-safe shapes mirroring the API responses (no server-only imports).

export type Material = "aluminum" | "contaminant" | "other";

export type ChallengeUser = {
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

export type RecentDeposit = {
  id: string;
  binName: string;
  material: Material;
  confidence: number;
  classifiedBy: "ai" | "heuristic";
  pointsAwarded: number;
  note: string;
  createdAt: number;
};

export type Stats = {
  todayDeposits: number;
  todayPoints: number;
  rankOverall: number;
  totalStudents: number;
  recent: RecentDeposit[];
};

export type Bin = {
  code: string;
  name: string;
  locationType: string;
};

export type TeamOption = {
  id: string;
  name: string;
  type: "dorm" | "org";
  region: string;
  seed: number;
};
