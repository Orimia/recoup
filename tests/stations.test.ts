import { test } from "node:test";
import assert from "node:assert/strict";
import { canonical, signEvent, verifyEvent, type StationEvent } from "../src/lib/server/stations.ts";

const base: StationEvent = {
  stationId: "station-demo-mm01",
  nfcId: "04DEMO0001",
  eventId: "evt-1",
  ts: 1_700_000_000_000,
  material: "aluminum",
  weightG: 14.9,
  verdict: "accept",
};

test("canonical string is fixed and excludes weightG", () => {
  assert.equal(canonical(base), "station-demo-mm01|04DEMO0001|evt-1|1700000000000|aluminum|accept");
  // weightG is a float and deliberately unsigned — changing it must not change the canonical string.
  assert.equal(canonical({ ...base, weightG: 999 }), canonical(base));
});

test("a correctly signed event verifies", () => {
  const sig = signEvent("station-secret", base);
  assert.equal(verifyEvent("station-secret", base, sig), true);
});

test("tampering with any signed field breaks the signature", () => {
  const sig = signEvent("station-secret", base);
  assert.equal(verifyEvent("station-secret", { ...base, verdict: "reject" }, sig), false);
  assert.equal(verifyEvent("station-secret", { ...base, nfcId: "04OTHER" }, sig), false);
  assert.equal(verifyEvent("station-secret", { ...base, eventId: "evt-2" }, sig), false);
});

test("wrong secret fails; changing only the unsigned weight still verifies", () => {
  const sig = signEvent("station-secret", base);
  assert.equal(verifyEvent("wrong-secret", base, sig), false);
  assert.equal(verifyEvent("station-secret", { ...base, weightG: 22.3 }, sig), true);
});

test("an empty signature is rejected", () => {
  assert.equal(verifyEvent("station-secret", base, ""), false);
});
