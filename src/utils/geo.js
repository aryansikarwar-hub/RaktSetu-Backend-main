/** Great-circle distance in km between two [lng, lat] points (Haversine). */
export function haversineKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

/** Approximate city centroids (lng, lat) for distance estimates without GPS. */
export const CITY_COORDS = {
  Mumbai: [72.8777, 19.076],
  Delhi: [77.209, 28.6139],
  'New Delhi': [77.209, 28.6139],
  Bangalore: [77.5946, 12.9716],
  Chennai: [80.2707, 13.0827],
  Pune: [73.8567, 18.5204],
  Hyderabad: [78.4867, 17.385],
  Kolkata: [88.3639, 22.5726],
  Indore: [75.8577, 22.7196],
  Ahmedabad: [72.5714, 23.0225],
  Jaipur: [75.7873, 26.9124],
};

export function cityCoords(city) {
  return CITY_COORDS[city] || null;
}
