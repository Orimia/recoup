import { test } from "node:test";
import assert from "node:assert/strict";
import { assess, isHardFail, type Signals } from "../src/lib/server/fraud.ts";

const clean: Signals = {
  hasPhoto: true,
  binCodeProvided: true,
  binCodeValid: true,
  geoProvided: true,
  geoOk: true,
  duplicateImage: false,
  rateBurst: false,
};

test("all checks passing yields no flags and full trust", () => {
  const r = assess(clean);
  assert.deepEqual(r.flags, []);
  assert.equal(r.trust, 1);
});

test("a duplicate image is a hard fail and tanks trust", () => {
  const r = assess({ ...clean, duplicateImage: true });
  assert.ok(r.flags.includes("duplicate_image"));
  assert.equal(isHardFail(r.flags), true);
  assert.ok(r.trust < 0.3);
});

test("missing location is a soft flag, not a hard fail", () => {
  const r = assess({ ...clean, geoProvided: false, geoOk: false });
  assert.ok(r.flags.includes("location_unverified"));
  assert.equal(isHardFail(r.flags), false);
});

test("an invalid bin code is a hard fail", () => {
  const r = assess({ ...clean, binCodeValid: false });
  assert.ok(r.flags.includes("bad_bin_code"));
  assert.equal(isHardFail(r.flags), true);
});

test("trust is clamped to the [0,1] range under maximal suspicion", () => {
  const r = assess({
    hasPhoto: false,
    binCodeProvided: true,
    binCodeValid: false,
    geoProvided: true,
    geoOk: false,
    duplicateImage: true,
    rateBurst: true,
  });
  assert.ok(r.trust >= 0 && r.trust <= 1);
});
