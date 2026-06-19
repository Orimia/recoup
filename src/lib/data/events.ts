// Live event stream — can deposits happening in real time (simulated).

export type LiveEvent = {
  id: string;
  t: number; // seconds ago
  binName: string;
  user: string;
  material: "aluminum" | "contaminant";
  confidence: number;
  reward: string;
};

export const seedEvents: LiveEvent[] = [
  { id: "e1", t: 2, binName: "Munchie Mart · Main", user: "@jmorales", material: "aluminum", confidence: 0.996, reward: "$0.10" },
  { id: "e2", t: 8, binName: "Rand Dining · North", user: "@kpatel14", material: "aluminum", confidence: 0.992, reward: "$0.10" },
  { id: "e3", t: 14, binName: "Towers Residence · Lobby", user: "@achoi", material: "aluminum", confidence: 0.988, reward: "$0.10" },
  { id: "e4", t: 21, binName: "Munchie Mart · Patio", user: "@sbrooks", material: "aluminum", confidence: 0.997, reward: "$0.10" },
  { id: "e5", t: 27, binName: "Munchie Mart · Main", user: "@rlao", material: "contaminant", confidence: 0.84, reward: "—" },
  { id: "e6", t: 34, binName: "Rand Dining · South", user: "@tnovak", material: "aluminum", confidence: 0.994, reward: "$0.10" },
  { id: "e7", t: 41, binName: "Stevenson Center · Atrium", user: "@dfields", material: "aluminum", confidence: 0.991, reward: "$0.10" },
  { id: "e8", t: 48, binName: "Munchie Mart · Main", user: "@mgarza", material: "aluminum", confidence: 0.989, reward: "$0.10" },
];

// Student-side activity for the Student UI page
export const studentActivity = [
  { date: "Today · 2:14 PM", location: "Munchie Mart · Main", reward: "$0.10", streak: 7 },
  { date: "Today · 9:31 AM", location: "Rand Dining · North", reward: "$0.10", streak: 7 },
  { date: "Yesterday · 7:42 PM", location: "Towers Residence", reward: "$0.10", streak: 6 },
  { date: "Yesterday · 12:08 PM", location: "Munchie Mart · Main", reward: "$0.10", streak: 6 },
  { date: "Apr 18 · 3:24 PM", location: "Stevenson Center", reward: "$0.10", streak: 5 },
];

export const studentSnapshot = {
  handle: "@hwang",
  name: "Haonan W.",
  semesterReturns: 148,
  semesterEarnings: 14.80,
  streakDays: 7,
  rank: 23,
  totalStudents: 4312,
  co2eKgSaved: 20.6,
  nextMilestone: { label: "150 returns · $15 bonus", progress: 148, goal: 150 },
};
