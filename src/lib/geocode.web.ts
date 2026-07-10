import type { Coordinates } from '@/lib/geo';

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
};

type NominatimResponse = {
  name?: string;
  address?: NominatimAddress;
};

/** Web: reverse-geocodes coordinates using Nominatim (OpenStreetMap). Returns a city/region name or null on failure. */
export async function reverseGeocode(coords: Coordinates, language?: string): Promise<string | null> {
  try {
    const lang = language?.split('-')[0] ?? 'en';
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
      `&lat=${coords.lat}&lon=${coords.lon}&zoom=10&accept-language=${lang}`;

    const res = await fetch(url, {
      headers: { 'Accept-Language': lang },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as NominatimResponse;
    const a = data.address;
    return a?.city ?? a?.town ?? a?.village ?? a?.municipality ?? a?.county ?? data.name ?? null;
  } catch {
    return null;
  }
}
