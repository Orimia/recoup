import { test } from "node:test";
import assert from "node:assert/strict";
import {
  award,
  BASE_POINTS,
  STREAK_BONUS,
  dayKey,
  yesterdayKey,
} from "../src/lib/challenge/points.ts";

// A fixed reference time; all day keys below are derived from it, so the tests
// are independent of the machine timezone.
const NOW = Date.UTC(2026, 2, 15, 18, 0, 0);

test("contaminant scores zero and does not count toward the cap", () => {
  const r = award({ material: "contaminant", countedToday: 0, lastDepositDay: null, streakDays: 3, now: NOW });
  assert.equal(r.points, 0);
  assert.equal(r.countedTowardCap, false);
  assert.equal(r.newStreakDays, 3); // streak untouched
});

test("first verified aluminum of a new day awards base + streak bonus", () => {
  const r = award({
    material: "aluminum",
    countedToday: 0,
    lastDepositDay: yesterdayKey(NOW), // continued from yesterday
    streakDays: 4,
    now: NOW,
  });
  assert.equal(r.points, BASE_POINTS + STREAK_BONUS);
  assert.equal(r.countedTowardCap, true);
  assert.equal(r.awardedStreakBonus, true);
  assert.equal(r.newStreakDays, 5);
});

test("a second return the same day gets base only, no streak bonus", () => {
  const r = award({
    material: "aluminum",
    countedToday: 1,
    lastDepositDay: dayKey(NOW), // already deposited today
    streakDays: 5,
    now: NOW,
  });
  assert.equal(r.points, BASE_POINTS);
  assert.equal(r.awardedStreakBonus, false);
  assert.equal(r.newStreakDays, 5);
});

test("a gap of more than a day resets the streak to 1", () => {
  const threeDaysAgo = dayKey(NOW - 3 * 24 * 60 * 60 * 1000);
  const r = award({ material: "aluminum", countedToday: 0, lastDepositDay: threeDaysAgo, streakDays: 9, now: NOW });
  assert.equal(r.newStreakDays, 1);
  assert.equal(r.awardedStreakBonus, true);
  assert.equal(r.points, BASE_POINTS + STREAK_BONUS);
});

test("reaching the daily cap stops awarding points but still records", () => {
  const r = award({ material: "aluminum", countedToday: 20, lastDepositDay: yesterdayKey(NOW), streakDays: 2, cap: 20, now: NOW });
  assert.equal(r.points, 0);
  assert.equal(r.countedTowardCap, false);
});
