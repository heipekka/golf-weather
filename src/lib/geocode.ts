import * as Location from 'expo-location';

import type { Coordinates } from '@/lib/geo';

/** Native: reverse-geocodes coordinates using expo-location. Returns a city/region name or null on failure. */
export async function reverseGeocode(coords: Coordinates, _language?: string): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: coords.lat,
      longitude: coords.lon,
    });
    const r = results[0];
    if (!r) return null;
    return r.city ?? r.subregion ?? r.region ?? r.name ?? null;
  } catch {
    return null;
  }
}
