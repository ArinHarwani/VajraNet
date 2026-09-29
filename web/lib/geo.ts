// lib/geo.ts - Geometry and motion calculation utilities compliant with PRD_00 §7

export const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Converts heading_deg (motion toward) to 16-point compass direction label.
 */
export function degToCompass(deg: number): string {
  const directions = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW"
  ];
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

/**
 * Computes from_deg from heading_deg:
 * heading_deg: compass bearing storm moves TOWARD
 * from_deg = (heading_deg + 180) % 360 (compass bearing storm moves FROM)
 */
export function headingToFromDeg(headingDeg: number): number {
  return ((headingDeg + 180) % 360 + 360) % 360;
}

/**
 * Format motion description: e.g. "Moving ENE (65°) at 38 km/h" or "Coming from WSW (245°)"
 */
export function formatMotionVector(headingDeg: number, speedKmh: number): string {
  const towardCompass = degToCompass(headingDeg);
  const fromDeg = headingToFromDeg(headingDeg);
  const fromCompass = degToCompass(fromDeg);
  return `Approaching from ${fromCompass} (${Math.round(fromDeg)}°) toward ${towardCompass} at ${Math.round(speedKmh)} km/h`;
}
