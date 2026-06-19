// Scoring + streak rules for the Challenge. Pure functions, no I/O — shared by
// the deposit route and (date helpers) anywhere that needs a local day key.

export const BASE_POINTS = 10; // verified aluminum
export const STREAK_BONUS = 5; // once per day, when a streak continues
export const DAILY_DEPOSIT_CAP = 20; // counted deposits per day (anti-farming)

/** Local-time YYYY-MM-DD key for a timestamp (defaults to now). */
export function dayKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD for the day before the given timestamp. */
export function yesterdayKey(ts: number = Date.now()): string {
  return dayKey(ts - 24 * 60 * 60 * 1000);
}

export type AwardInput = {
  material: "aluminum" | "contaminant" | "other";
  /** how many counted deposits the user already has today */
  countedToday: number;
  /** the user's lastDepositDay before this deposit */
  lastDepositDay: string | null;
  /** the user's current streak before this deposit */
  streakDays: number;
  /** daily counted-deposit cap; defaults to DAILY_DEPOSIT_CAP */
  cap?: number;
  now?: number;
};

export type AwardResult = {
  points: number;
  countedTowardCap: boolean;
  newStreakDays: number;
  awardedStreakBonus: boolean;
  reason: string;
};

/** Decide points + streak for one deposit. Contaminants score zero by design. */
export function award({
  material,
  countedToday,
  lastDepositDay,
  streakDays,
  cap = DAILY_DEPOSIT_CAP,
  now = Date.now(),
}: AwardInput): AwardResult {
  const today = dayKey(now);

  if (material !== "aluminum") {
    // Contaminant still updates nothing but is recorded by the caller.
    return {
      points: 0,
      countedTowardCap: false,
      newStreakDays: streakDays,
      awardedStreakBonus: false,
      reason: "Not aluminum — recorded as contamination, no points.",
    };
  }

  if (countedToday >= cap) {
    return {
      points: 0,
      countedTowardCap: false,
      newStreakDays: streakDays,
      awardedStreakBonus: false,
      reason: `Daily cap of ${cap} verified returns reached. Still logged.`,
    };
  }

  // Streak: bumps once per day on the first counted return of a new day.
  const firstToday = lastDepositDay !== today;
  let newStreak = streakDays;
  let bonus = false;
  if (firstToday) {
    newStreak = lastDepositDay === yesterdayKey(now) ? streakDays + 1 : 1;
    bonus = true;
  }

  const points = BASE_POINTS + (bonus ? STREAK_BONUS : 0);
  return {
    points,
    countedTowardCap: true,
    newStreakDays: newStreak,
    awardedStreakBonus: bonus,
    reason: bonus
      ? `+${BASE_POINTS} verified · +${STREAK_BONUS} streak (day ${newStreak})`
      : `+${BASE_POINTS} verified aluminum`,
  };
}
