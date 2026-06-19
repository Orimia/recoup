// Station simulator — signs and posts a deposit event exactly like the bin
// firmware will, so the whole verified-event path is testable with no hardware.
//
// Usage:
//   node scripts/station-sim.mjs                  # accept event → local server
//   node scripts/station-sim.mjs --url https://vandyloop.vercel.app
//   node scripts/station-sim.mjs --reject         # a rejected (non-aluminum) event
//   node scripts/station-sim.mjs --bad            # wrong signature (should be 401)
//   STATION_ID=... STATION_SECRET=... NFC_ID=... node scripts/station-sim.mjs
//
// Defaults match the local demo seed (station-demo-mm01 / 04DEMO0001).

import { createHmac, randomUUID } from "node:crypto";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};

const url = opt("--url", "http://localhost:3000").replace(/\/$/, "");
const stationId = process.env.STATION_ID || "station-demo-mm01";
const secret = process.env.STATION_SECRET || "demo-station-secret-key";
const nfcId = process.env.NFC_ID || "04DEMO0001";
const verdict = flag("--reject") ? "reject" : "accept";
const material = verdict === "reject" ? "contaminant" : "aluminum";

const evt = {
  stationId,
  nfcId,
  eventId: randomUUID(),
  ts: Date.now(),
  material,
  weightG: verdict === "reject" ? 320 : 14.6,
  verdict,
};

// Must match src/lib/server/stations.ts canonical() — weightG is NOT signed.
const canonical = [evt.stationId, evt.nfcId, evt.eventId, evt.ts, evt.material, evt.verdict].join("|");
let hmac = createHmac("sha256", secret).update(canonical).digest("hex");
if (flag("--bad")) hmac = "deadbeef"; // simulate a forged event

const res = await fetch(`${url}/api/bin-events`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ ...evt, hmac }),
});
const json = await res.json().catch(() => ({}));
console.log(`POST ${url}/api/bin-events  [${verdict}]  HTTP ${res.status}`);
console.log(JSON.stringify(json, null, 2));
process.exit(res.ok ? 0 : 1);
