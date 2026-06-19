// ILLUSTRATIVE seed data for the narrative / pitch pages only (not measured).
// Real verified data lives in the database (src/lib/server). The experiment and
// AI-style numbers here are examples, not results. See docs/simulated-vs-real.md.
//
// Weekly trend data, 12 weeks rolling. Shows an example pilot ramp.

export type TrendPoint = {
  week: string;
  returns: number;
  activeUsers: number;
  contamination: number;
  forecast?: boolean;
};

export const weeklyTrend: TrendPoint[] = [
  { week: "W-11", returns: 4210, activeUsers: 1420, contamination: 0.092 },
  { week: "W-10", returns: 4980, activeUsers: 1612, contamination: 0.088 },
  { week: "W-9", returns: 6142, activeUsers: 1908, contamination: 0.081 },
  { week: "W-8", returns: 6811, activeUsers: 2144, contamination: 0.077 },
  { week: "W-7", returns: 7422, activeUsers: 2388, contamination: 0.073 },
  { week: "W-6", returns: 8190, activeUsers: 2612, contamination: 0.069 },
  { week: "W-5", returns: 8841, activeUsers: 2814, contamination: 0.066 },
  { week: "W-4", returns: 9417, activeUsers: 2998, contamination: 0.064 },
  { week: "W-3", returns: 10122, activeUsers: 3201, contamination: 0.062 },
  { week: "W-2", returns: 11008, activeUsers: 3412, contamination: 0.061 },
  { week: "W-1", returns: 11841, activeUsers: 3588, contamination: 0.059 },
  { week: "W0", returns: 12825, activeUsers: 3742, contamination: 0.058 },
  { week: "W+1", returns: 13620, activeUsers: 3881, contamination: 0.056, forecast: true },
  { week: "W+2", returns: 14411, activeUsers: 4022, contamination: 0.054, forecast: true },
  { week: "W+3", returns: 15214, activeUsers: 4168, contamination: 0.053, forecast: true },
];

export type HourlyPoint = {
  hour: string;
  returns: number;
  contamination: number;
};

// Today, hour by hour
export const hourlyTrend: HourlyPoint[] = [
  { hour: "6a", returns: 18, contamination: 0.02 },
  { hour: "7a", returns: 41, contamination: 0.03 },
  { hour: "8a", returns: 88, contamination: 0.04 },
  { hour: "9a", returns: 102, contamination: 0.045 },
  { hour: "10a", returns: 74, contamination: 0.041 },
  { hour: "11a", returns: 126, contamination: 0.052 },
  { hour: "12p", returns: 198, contamination: 0.061 },
  { hour: "1p", returns: 241, contamination: 0.066 },
  { hour: "2p", returns: 142, contamination: 0.054 },
  { hour: "3p", returns: 118, contamination: 0.049 },
  { hour: "4p", returns: 164, contamination: 0.058 },
  { hour: "5p", returns: 221, contamination: 0.067 },
  { hour: "6p", returns: 188, contamination: 0.064 },
  { hour: "7p", returns: 141, contamination: 0.071 },
  { hour: "8p", returns: 96, contamination: 0.118 },
  { hour: "9p", returns: 58, contamination: 0.108 },
  { hour: "10p", returns: 31, contamination: 0.091 },
];

// Reward experiment results — used on AI Insights page
export const rewardExperiment = {
  name: "Instant vs Raffle incentive",
  cohortA: {
    label: "Control (raffle only)",
    n: 412,
    firstReturnRate: 0.38,
    repeatWithin7d: 0.41,
    contamination: 0.071,
  },
  cohortB: {
    label: "Instant $0.10 meal money",
    n: 428,
    firstReturnRate: 0.61,
    repeatWithin7d: 0.58,
    contamination: 0.046,
  },
  // Probabilistic winner — Thompson-sampling style. Believable without being fake.
  posteriorWinProb: 0.94,
  liftPct: 0.22,
  daysRun: 12,
};

// Athletics venue halftime behavior
export const athleticsPulse = [
  { t: "19:00", returns: 12, note: "Doors open" },
  { t: "19:30", returns: 48, note: "Pre-game peak" },
  { t: "20:15", returns: 22, note: "1st half" },
  { t: "20:45", returns: 31, note: "1st half" },
  { t: "21:15", returns: 84, note: "Halftime start" },
  { t: "21:35", returns: 167, note: "+20 min after halftime ← peak" },
  { t: "22:00", returns: 58, note: "2nd half" },
  { t: "22:30", returns: 34, note: "2nd half" },
  { t: "23:00", returns: 92, note: "Post-game" },
  { t: "23:30", returns: 41, note: "Exit" },
];
