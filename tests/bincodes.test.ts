import { test } from "node:test";
import assert from "node:assert/strict";
import { currentBinCode, verifyBinCode } from "../src/lib/server/bincodes.ts";

const NOW = 1_700_000_000_000;
const WINDOW_MS = 90_000; // matches config.binCodeWindowSec default (90s)

test("the current code is 6 digits and verifies now", () => {
  const code = currentBinCode("MM-01", NOW);
  assert.match(code, /^\d{6}$/);
  assert.equal(verifyBinCode("MM-01", code, NOW), true);
});

test("a code from the adjacent window still verifies (clock/scan skew)", () => {
  const prev = currentBinCode("MM-01", NOW - WINDOW_MS);
  assert.equal(verifyBinCode("MM-01", prev, NOW), true);
});

test("an expired code (10 minutes old) is rejected", () => {
  const old = currentBinCode("MM-01", NOW - 10 * 60 * 1000);
  assert.equal(verifyBinCode("MM-01", old, NOW), false);
});

test("a wrong or missing code is rejected", () => {
  assert.equal(verifyBinCode("MM-01", "000000", NOW), false);
  assert.equal(verifyBinCode("MM-01", undefined, NOW), false);
});

test("different bins get different codes", () => {
  assert.notEqual(currentBinCode("MM-01", NOW), currentBinCode("MM-02", NOW));
});
