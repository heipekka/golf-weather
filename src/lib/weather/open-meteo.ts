import type { ForecastPoint, SourceForecast } from './types';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

const HOURLY_PARAMS = [
  'temperature_2m',
  'precipitation',
  'precipitation_probability',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
  'cloud_cover',
  'weather_code',
].join(',');

type OpenMeteoHourly = {
  time: string[];
  temperature_2m: (number | null)[];
  precipitation: (number | null)[];
  precipitation_probability: (number | null)[];
  wind_speed_10m: (number | null)[];
  wind_gusts_10m: (number | null)[];
  wind_direction_10m: (number | null)[];
  cloud_cover: (number | null)[];
  weather_code: (number | null)[];
};

type OpenMeteoResponse = {
  hourly: OpenMeteoHourly;
};

export async function fetchOpenMeteo(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<SourceForecast> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: HOURLY_PARAMS,
    windspeed_unit: 'ms',
    timezone: 'UTC',
    forecast_days: '3',
  });

  const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const h = data.hourly;

  const hourly: ForecastPoint[] = h.time.map((time, i) => ({
    // Open-Meteo returns UTC local time without a trailing "Z" when timezone=UTC.
    time: `${time}:00Z`,
    temperature: h.temperature_2m[i] ?? null,
    windSpeed: h.wind_speed_10m[i] ?? null,
    windGust: h.wind_gusts_10m[i] ?? null,
    windDirection: h.wind_direction_10m[i] ?? null,
    precipitation: h.precipitation[i] ?? null,
    precipitationProbability: h.precipitation_probability[i] ?? null,
    cloudCover: h.cloud_cover[i] ?? null,
    weatherCode: h.weather_code[i] ?? null,
    symbol: null,
  }));

  return { source: 'openmeteo', label: 'Open-Meteo', hourly };
}
