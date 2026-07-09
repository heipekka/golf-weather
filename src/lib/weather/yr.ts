import type { ForecastPoint, SourceForecast } from './types';

const YR_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
// MET Norway requires a descriptive User-Agent identifying the app, see
// https://api.met.no/doc/TermsOfService. Browsers may silently strip this
// header, which can cause requests to fail when running on web.
const USER_AGENT = 'golf-weather-app/1.0 github.com/heipekka/golf-weather';

const MAX_HOURS = 72;

type YrTimeseriesEntry = {
  time: string;
  data: {
    instant: {
      details: {
        air_temperature?: number;
        wind_speed?: number;
        wind_from_direction?: number;
        cloud_area_fraction?: number;
      };
    };
    next_1_hours?: {
      summary?: { symbol_code?: string };
      details?: { precipitation_amount?: number };
    };
  };
};

type YrResponse = {
  properties: {
    timeseries: YrTimeseriesEntry[];
  };
};

export async function fetchYr(lat: number, lon: number, signal?: AbortSignal): Promise<SourceForecast> {
  const params = new URLSearchParams({
    lat: lat.toFixed(4),
    lon: lon.toFixed(4),
  });

  const response = await fetch(`${YR_URL}?${params.toString()}`, {
    signal,
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`YR.no request failed with status ${response.status}`);
  }

  const data = (await response.json()) as YrResponse;

  const hourly: ForecastPoint[] = data.properties.timeseries.slice(0, MAX_HOURS).map((entry) => {
    const instant = entry.data.instant.details;
    const next1h = entry.data.next_1_hours;

    return {
      time: entry.time,
      temperature: instant.air_temperature ?? null,
      windSpeed: instant.wind_speed ?? null,
      windGust: null,
      windDirection: instant.wind_from_direction ?? null,
      precipitation: next1h?.details?.precipitation_amount ?? null,
      precipitationProbability: null,
      cloudCover: instant.cloud_area_fraction ?? null,
      weatherCode: null,
      symbol: next1h?.summary?.symbol_code ?? null,
    };
  });

  return { source: 'yr', label: 'YR.no (MET Norway)', hourly };
}
