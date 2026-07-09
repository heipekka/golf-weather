export type Coordinates = {
  lat: number;
  lon: number;
};

export type GolfCourse = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
};

export type GolfCourseWithDistance = GolfCourse & {
  distanceKm: number;
};

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function haversineKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_KM * c;
}

export function sortByDistance(
  courses: GolfCourse[],
  origin: Coordinates
): GolfCourseWithDistance[] {
  return courses
    .map((course) => ({ ...course, distanceKm: haversineKm(origin, course) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
