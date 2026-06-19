# VandyLoop bench proof-of-concept (firmware)

The smallest real demo: a trigger on an ESP32 → a signed event → points + the live
operator dashboard update in real time. This proves the closed loop is real and
de-risks the full bin build. It is **one sensor on purpose** — not production firmware.

## Parts (~$30–50, buyable today)

| Part | ~$ | Notes |
|------|----|-------|
| ESP32 dev board (e.g. ESP32-WROOM DevKitC) | 8 | Wi-Fi + the crypto we need is built in |
| Momentary push button | 1 | quick-start trigger (no sensor needed to prove the loop) |
| Inductive proximity sensor (LJ12A3-4-Z/BX) | 6 | the real "it detects aluminum" demo (needs a 6–36V supply + voltage divider to 3.3V) |
| LED + 220Ω resistor, breadboard, jumpers | ~10 | feedback + wiring |

Start with the **button** to prove the loop in an afternoon; swap in the inductive
sensor for the "wave a can, it fires" version.

## Wiring (quick start)

- Button: one leg to `GPIO4`, other leg to `GND`. (Firmware uses `INPUT_PULLUP`.)
- LED: `GPIO2` (onboard LED on most boards) → it blinks 3× on an accepted deposit.
- Inductive sensor (later): sensor signal → voltage divider → `GPIO4`; power the sensor from its required rail, common ground with the ESP32. Set `TRIGGER_ACTIVE_LOW` to match your sensor (NPN N.O. is active-low).

## Setup

1. Arduino IDE → install the **esp32** board package (Boards Manager). No extra
   libraries needed — `WiFi`, `HTTPClient`, and `mbedtls` ship with the core.
2. Open `vandyloop-poc/vandyloop-poc.ino`, edit the CONFIG block: Wi-Fi, and the
   API/station/card values.
3. Flash. Open Serial Monitor (115200) to watch requests/responses.

### Quick start (local, zero backend setup)

Point at your laptop running `npm run dev` (same Wi-Fi):

```
API_BASE       = "http://<your-laptop-ip>:3000"
STATION_ID     = "station-demo-mm01"        // preloaded demo station
STATION_SECRET = "demo-station-secret-key"  // preloaded demo secret
NFC_ID         = "04DEMO0001"               // preloaded linked demo card
```

Press the button → Serial shows `-> 200`, LED blinks 3×, and the demo student's
points tick up on `/challenge` and `/admin`.

### Going live (demo against production)

1. Register a station to get a real id + secret (operator key required):
   ```
   curl -X POST https://vandyloop.vercel.app/api/admin/stations \
     -H "x-admin-key: <YOUR_OPERATOR_KEY>" -H "content-type: application/json" \
     -d '{"name":"Bench POC","binCode":"MM-01"}'
   ```
   Copy the returned `id` and `secret` into the firmware. The secret is shown once.
2. Link a card to a real account: sign up a student on the site, then link a tap id
   to that account via `POST /api/identity/link` (while signed in). Put that id in `NFC_ID`.
3. Set `API_BASE = "https://vandyloop.vercel.app"`. Flash. Now a button press posts a
   verified return to the live system.

## The demo script (for a live walkthrough)

1. Open `/admin` on a laptop (live operator console).
2. Press the button (or wave a can past the inductive sensor).
3. The deposit appears in the live feed; the student's points update on `/challenge`.
4. Say the one line that matters: *"The bin signs every event — this can't be faked
   from a phone. This is the trusted-data spine; the AI layer runs on top of it once
   real bins collect events."*

## What's deliberately NOT here (and why)

Full sensor fusion (2× IR + Hall + load cell), the NFC reader, the one-way baffle,
and offline retry queues are in [`docs/hardware-verification.md`](../docs/hardware-verification.md).
Don't build them until a hardware team is on board — they may pick different
components, and over-speccing ahead of them is wasted work.
