/**
 * Haversine distance calculations, in meters and kilometers.
 */

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate the great-circle distance between two lat/lng points.
 * @returns {number} distance in meters
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * @returns {number} distance in kilometers
 */
export function calculateDistanceKilometers(lat1, lon1, lat2, lon2) {
  return calculateDistanceMeters(lat1, lon1, lat2, lon2) / 1000;
}

/**
 * Human-friendly distance string: meters under 1km, otherwise km with 1 decimal.
 */
export function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
