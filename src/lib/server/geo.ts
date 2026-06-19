// Geofence check: was the device physically near the bin when it logged a return?
// Haversine distance in meters. Spoofable on rooted devices, but it raises the cost
// of remote farming and is one signal among several (see fraud.ts).

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // earth radius, meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export type GeoResult = { provided: boolean; ok: boolean; distanceM: number | null };

export function checkGeofence(
  binLat: number,
  binLng: number,
  lat: number | undefined,
  lng: number | undefined,
  radiusM: number
): GeoResult {
  if (typeof lat !== "number" || typeof lng !== "number") {
    return { provided: false, ok: false, distanceM: null };
  }
  const d = haversineMeters(binLat, binLng, lat, lng);
  return { provided: true, ok: d <= radiusM, distanceM: Math.round(d) };
}
