import type { Coordinates } from '@/lib/geo';

import { fetchWithPolicy } from './request';
import type { ForecastPoint, SourceForecast } from './types';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

const SOURCE_LABEL = 'Open-Meteo';

const HOURLY_PARAMS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation',
  'precipitation_probability',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
  'cloud_cover',
  'weather_code',
].join(',');

/**
 * Coordinates sent per request. Open-Meteo accepts comma-separated lists, so
 * a whole list screen costs one request instead of one per course, which keeps
 * it clear of the provider's per-IP concurrency limit. Chunking caps both the
 * URL length and the response size (~5 KB of JSON per location).
 */
const MAX_LOCATIONS_PER_REQUEST = 100;

type OpenMeteoHourly = {
  time: string[];
  temperature_2m: (number | null)[];
  apparent_temperature: (number | null)[];
  precipitation: (number | null)[];
  precipitation_probability: (number | null)[];
  wind_speed_10m: (number | null)[];
  wind_gusts_10m: (number | null)[];
  wind_direction_10m: (number | null)[];
  cloud_cover: (number | null)[];
  weather_code: (number | null)[];
};

type OpenMeteoLocation = {
  hourly: OpenMeteoHourly;
};

function toForecast(location: OpenMeteoLocation): SourceForecast {
  const h = location.hourly;

  const hourly: ForecastPoint[] = h.time.map((time, i) => ({
    // Open-Meteo returns UTC local time without a trailing "Z" when timezone=UTC.
    time: `${time}:00Z`,
    temperature: h.temperature_2m[i] ?? null,
    apparentTemperature: h.apparent_temperature[i] ?? null,
    windSpeed: h.wind_speed_10m[i] ?? null,
    windGust: h.wind_gusts_10m[i] ?? null,
    windDirection: h.wind_direction_10m[i] ?? null,
    precipitation: h.precipitation[i] ?? null,
    precipitationProbability: h.precipitation_probability[i] ?? null,
    cloudCover: h.cloud_cover[i] ?? null,
    weatherCode: h.weather_code[i] ?? null,
    symbol: null,
  }));

  return { source: 'openmeteo', label: SOURCE_LABEL, hourly };
}

/**
 * Requests one chunk of locations and returns a forecast per input point, in
 * the same order. Throws if the request or the response shape fails.
 *
 * Results are matched to inputs strictly by position: the coordinates echoed
 * back are snapped to the model grid (60.2287 comes back as 60.25), so they
 * can't be used to identify which course a location belongs to.
 */
async function requestChunk(
  points: Coordinates[],
  signal?: AbortSignal
): Promise<SourceForecast[]> {
  const params = new URLSearchParams({
    latitude: points.map((point) => point.lat).join(','),
    longitude: points.map((point) => point.lon).join(','),
    hourly: HOURLY_PARAMS,
    windspeed_unit: 'ms',
    timezone: 'UTC',
    forecast_days: '3',
  });

  const body = await fetchWithPolicy(`${OPEN_METEO_URL}?${params.toString()}`, undefined, {
    source: 'openmeteo',
    signal,
  });

  // A single location returns a bare object; several return an array.
  const parsed = JSON.parse(body) as OpenMeteoLocation | OpenMeteoLocation[];
  const locations = Array.isArray(parsed) ? parsed : [parsed];

  if (locations.length !== points.length) {
    throw new Error(
      `Open-Meteo returned ${locations.length} locations for ${points.length} requested`
    );
  }

  return locations.map(toForecast);
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Fetches forecasts for many locations at once, returning one entry per input
 * point in the same order. Never rejects: a chunk that fails yields error
 * entries for just its own points, so one bad chunk can't discard the rest.
 */
export async function fetchOpenMeteoBatch(
  points: Coordinates[],
  signal?: AbortSignal
): Promise<SourceForecast[]> {
  if (points.length === 0) return [];

  const chunks = chunk(points, MAX_LOCATIONS_PER_REQUEST);
  const results = await Promise.all(
    chunks.map(async (group) => {
      try {
        return await requestChunk(group, signal);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'errors.failedToLoadForecast';
        return group.map<SourceForecast>(() => ({
          source: 'openmeteo',
          label: SOURCE_LABEL,
          hourly: [],
          error: message,
        }));
      }
    })
  );

  return results.flat();
}

export async function fetchOpenMeteo(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<SourceForecast> {
  const [forecast] = await requestChunk([{ lat, lon }], signal);
  return forecast;
}
