# VandyLoop bin — physical verification spec

How a bin proves that one empty aluminum can was deposited by a specific student, cheaply and hard to fake. This is the spec for whoever builds the board, plus the contract the backend already implements (`POST /api/bin-events`).

## Principle

No single sensor is trusted. A return is real only when **independent cheap signals agree**, the **station signs the event** (so events can't be spoofed from outside), and **collected aluminum is weighed at servicing** as a statistical backstop. Photos are deliberately *not* the verification — they're fakeable.

## Verification logic (sensor fusion)

A deposit is `accept` only if, inside an NFC session, all hold within ~2 seconds:

| Check | Sensor | Pass condition |
|-------|--------|----------------|
| Identity | NFC reader (PN532 / wallet) | a card/phone tapped → `nfcId`, session open ≤10s |
| Presence + direction | 2× IR break-beam | exactly one object, top→bottom (downward) |
| Metal | inductive proximity sensor | metal present |
| Non-ferrous (aluminum) | Hall sensor + magnet | not ferromagnetic |
| Empty + plausible can | load cell (HX711) | weight delta ∈ [8 g, 25 g] |

Anything else → `reject` (no reward, counted as contamination proxy). Then a **one-way baffle** drops the can into a locked bin so it can't be retrieved and re-scanned.

## Bill of materials (~$60–90 core electronics/bin)

| Part | Example | ~$ |
|------|---------|----|
| Controller (Wi-Fi) | ESP32-WROOM dev board | 6 |
| NFC reader | PN532 module | 8 |
| Presence ×2 | IR break-beam pairs | 5 |
| Weight | 5 kg load cell + HX711 amp | 8 |
| Metal | inductive proximity sensor (LJ12A3) | 6 |
| Non-ferrous | Hall sensor + neodymium magnet | 2 |
| Feedback | LED ring + buzzer | 5 |
| Misc | wiring, relay, protection, perfboard | 20 |

Mechanical (in the $3,000 enclosure line): single-can throat (~70 mm), sensor mounting collar, load-cell weigh gate, sprung one-way baffle, locked collection bin.

Phase the build: **MVP** = NFC + 2× IR + load cell + inductive (already robust). **+Al-grade** = add Hall (reject steel), or eddy-current conductivity for RVM-grade. **+Ops** = ultrasonic fill sensor for servicing alerts; optional camera for *spot-audit only* (never primary).

## Firmware state machine (ESP32)

```
IDLE
  └─ NFC tap detected → store nfcId, open SESSION (10s timer), LED amber
SESSION
  └─ object enters (beam 1 then beam 2 within 400ms = downward):
       read inductive, hall, weight delta
       FUSION:
         metal && !ferrous && 8g<=Δw<=25g && single-downward  → ACCEPT
         else                                                  → REJECT
  └─ on ACCEPT: LED green + buzzer; sign event; POST /api/bin-events; close session
  └─ on REJECT: LED red; increment localrejects; keep session open until timeout
  └─ on timeout: close session, LED off
Always: heartbeat POST every 60s (uptime); retry queue for offline events
```

## Signed event contract (matches the backend)

The station POSTs JSON to `/api/bin-events`. Identity comes from the tap (`nfcId`); trust comes from the HMAC.

```json
{
  "stationId": "station-xxxx",
  "nfcId": "04A1B2C3D4",
  "eventId": "uuid-per-deposit",
  "ts": 1718600000000,
  "material": "aluminum",
  "weightG": 14.6,
  "verdict": "accept",
  "fwVersion": "1.0.0",
  "hmac": "<hex>"
}
```

**Canonical string** (server and firmware must build it identically):

```
canonical = [stationId, nfcId, eventId, ts, material, verdict].join("|")
hmac      = HMAC_SHA256(stationSecret, canonical)  → lowercase hex
```

`weightG` is sent in the payload but deliberately **excluded from the signed canonical** — it's a float, and C-vs-JS float formatting would break the HMAC. Weight is informational; the fields that drive points (material, verdict, ids, ts) are all strings/ints and are signed.

Server checks: station exists, `hmac` matches (constant-time), `ts` within ±300 s, `eventId` not seen before (idempotent replay protection), `verdict==="accept"` and `material==="aluminum"`. Then it maps `nfcId → user` and awards points (same scoring as the app path: base + streak, daily cap still applies). `reject` events may be sent too (for the contamination proxy) and never award.

Each station is registered once via `POST /api/admin/stations` (returns its `stationId` + `secret`, shown once) and the firmware is provisioned with that secret. Students link their card once: tap → app links `nfcId` to their account (`POST /api/identity/link`).

## Why this resists the obvious attacks

- **Fake photo / self-report** → impossible; only the signed station can create a verified event.
- **Spoof events from a laptop** → rejected (no valid HMAC; `eventId` replay-deduped).
- **Insert and pull back to re-scan** → two-beam direction + one-way baffle.
- **Drop trash/plastic** → metal + weight gate reject it (logged as contamination).
- **Steel can / keys / coins** → Hall (ferrous) or weight gate reject.
- **Foil ball gaming a $0.10 reward** → low value, one-at-a-time throat, daily cap, and the weight-reconciliation backstop flags any bin where counts ≫ kg collected.

## Calibration & reconciliation

- Tare the load cell at servicing; log zero-drift.
- At each pickup, weigh collected aluminum; expect `returns × 14.9 g ≈ kg`. If counts far exceed weight, flag the station for inspection/recalibration and discount its data. This is the cheap backstop that makes the whole economy defensible.
