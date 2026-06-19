import { test } from "node:test";
import assert from "node:assert/strict";
import { haversineMeters, checkGeofence } from "../src/lib/server/geo.ts";

test("distance between identical points is zero", () => {
  assert.equal(Math.round(haversineMeters(36.1447, -86.8027, 36.1447, -86.8027)), 0);
});

test("a point inside the radius passes", () => {
  const binLat = 36.1447;
  const binLng = -86.8027;
  const r = checkGeofence(binLat, binLng, binLat + 0.0003, binLng, 150); // ~33m north
  assert.equal(r.provided, true);
  assert.equal(r.ok, true);
  assert.ok(r.distanceM !== null && r.distanceM < 150);
});

test("a point outside the radius fails", () => {
  const r = checkGeofence(36.1447, -86.8027, 36.1447 + 0.02, -86.8027, 150); // ~2.2km north
  assert.equal(r.provided, true);
  assert.equal(r.ok, false);
});

test("missing coordinates are reported as not-provided", () => {
  assert.deepEqual(checkGeofence(36.1447, -86.8027, undefined, undefined, 150), {
    provided: false,
    ok: false,
    distanceM: null,
  });
});
