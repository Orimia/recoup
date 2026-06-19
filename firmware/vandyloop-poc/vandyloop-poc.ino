/*
 * VandyLoop — bench proof-of-concept firmware (ESP32)
 * ----------------------------------------------------
 * Smallest thing that proves the closed loop is REAL:
 *   trigger (button or inductive sensor) -> sign event -> POST to the live API
 *   -> points + operator dashboard update in real time.
 *
 * This is intentionally ONE sensor. It is NOT production firmware (no full
 * sensor fusion, no NFC reader yet — nfcId is hardcoded to a linked card).
 * The point is to demo the loop and de-risk the hardware build, cheaply.
 *
 * Parts (~$30-50): ESP32 dev board, a momentary push button (quick start) OR an
 * inductive proximity sensor (LJ12A3-4-Z/BX) for the real "it detects metal"
 * demo, an LED, jumpers. See firmware/README.md.
 *
 * The HMAC canonical MUST match src/lib/server/stations.ts exactly:
 *   canonical = stationId|nfcId|eventId|ts|material|verdict   (weightG NOT signed)
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "mbedtls/md.h"
#include <time.h>

// ----------------------- CONFIG (edit these) -----------------------
const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Quick start: point at your laptop's local dev server (uses the preloaded demo
// station + demo card). For the live demo, use https://vandyloop.vercel.app and a
// station you registered via POST /api/admin/stations + a real linked card.
const char* API_BASE       = "http://192.168.1.50:3000";   // or "https://vandyloop.vercel.app"
const char* STATION_ID     = "station-demo-mm01";          // demo station (local) or your registered id
const char* STATION_SECRET = "demo-station-secret-key";    // demo secret (local) or your station secret
const char* NFC_ID         = "04DEMO0001";                 // a card linked to an account

const int TRIGGER_PIN = 4;   // push button to GND, or inductive sensor signal pin
const int LED_PIN     = 2;   // onboard LED (deposit feedback)
const bool TRIGGER_ACTIVE_LOW = true;  // button to GND = LOW when pressed
// -------------------------------------------------------------------

static String hmacSha256Hex(const String& key, const String& msg) {
  byte out[32];
  const mbedtls_md_info_t* info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, info, 1 /* HMAC */);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)key.c_str(), key.length());
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)msg.c_str(), msg.length());
  mbedtls_md_hmac_finish(&ctx, out);
  mbedtls_md_free(&ctx);
  char hex[65];
  for (int i = 0; i < 32; i++) sprintf(hex + i * 2, "%02x", out[i]);
  hex[64] = 0;
  return String(hex);
}

static String epochMsString() {
  // Seconds precision is fine: the server tolerates ±5 min clock skew.
  char buf[21];
  sprintf(buf, "%llu", (unsigned long long)time(nullptr) * 1000ULL);
  return String(buf);
}

static String makeEventId() {
  char buf[40];
  sprintf(buf, "evt-%08x-%lu", (unsigned)esp_random(), (unsigned long)millis());
  return String(buf);
}

static void blink(int times, int ms) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH); delay(ms);
    digitalWrite(LED_PIN, LOW);  delay(ms);
  }
}

void postDeposit() {
  const String eventId = makeEventId();
  const String ts = epochMsString();
  const String material = "aluminum";
  const String verdict = "accept";

  // Canonical string — keep identical to the server's stations.ts canonical().
  String canonical = String(STATION_ID) + "|" + NFC_ID + "|" + eventId + "|" +
                     ts + "|" + material + "|" + verdict;
  String hmac = hmacSha256Hex(STATION_SECRET, canonical);

  String body = String("{\"stationId\":\"") + STATION_ID +
                "\",\"nfcId\":\"" + NFC_ID +
                "\",\"eventId\":\"" + eventId +
                "\",\"ts\":" + ts +
                ",\"material\":\"" + material +
                "\",\"weightG\":15,\"verdict\":\"" + verdict +
                "\",\"hmac\":\"" + hmac + "\"}";

  String url = String(API_BASE) + "/api/bin-events";
  HTTPClient http;
  int code;
  if (url.startsWith("https")) {
    WiFiClientSecure client;
    client.setInsecure(); // POC only: skip cert validation. Pin certs for production.
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");
    code = http.POST(body);
  } else {
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    code = http.POST(body);
  }

  String resp = http.getString();
  http.end();
  Serial.printf("POST %s -> %d\n%s\n", url.c_str(), code, resp.c_str());
  if (code == 200) blink(3, 120);   // accepted
  else             blink(1, 600);   // rejected / error
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(TRIGGER_PIN, TRIGGER_ACTIVE_LOW ? INPUT_PULLUP : INPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println(" connected");

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("NTP");
  while (time(nullptr) < 1700000000) { delay(300); Serial.print("."); }
  Serial.println(" synced");
  blink(2, 80);
}

void loop() {
  static bool armed = true;
  int level = digitalRead(TRIGGER_PIN);
  bool triggered = TRIGGER_ACTIVE_LOW ? (level == LOW) : (level == HIGH);

  if (triggered && armed) {
    armed = false;
    Serial.println("Deposit detected -> reporting");
    postDeposit();
  }
  if (!triggered) armed = true; // simple debounce / re-arm on release
  delay(30);
}
