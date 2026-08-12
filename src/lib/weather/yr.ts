import { Platform } from 'react-native';

import { computeApparentTemperature } from './feels-like';
import { fetchWithPolicy } from './request';
import type { ForecastPoint, SourceForecast } from './types';

const YR_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
// MET Norway requires a descriptive User-Agent identifying the app, see
// https://api.met.no/doc/TermsOfService. Browsers strip custom User-Agent
// headers and MET doesn't grant CORS to arbitrary origins, so web goes
// through a same-origin proxy (api/yr.ts) that sets this header server-side
// instead of calling MET directly.
const USER_AGENT = 'golf-weather-app/1.0 github.com/heipekka/golf-weather';
const WEB_PROXY_URL = '/api/yr';

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

  // Native can identify itself with a custom User-Agent and call MET
  // directly; web can't (see the note above), so it goes through the
  // same-origin proxy instead.
  const isWeb = Platform.OS === 'web';
  const url = isWeb ? `${WEB_PROXY_URL}?${params.toString()}` : `${YR_URL}?${params.toString()}`;
  const init = isWeb ? undefined : { headers: { 'User-Agent': USER_AGENT } };

  const body = await fetchWithPolicy(url, init, { source: 'yr', signal });

  const data = JSON.parse(body) as YrResponse;

  const hourly: ForecastPoint[] = data.properties.timeseries.slice(0, MAX_HOURS).map((entry) => {
    const instant = entry.data.instant.details;
    const next1h = entry.data.next_1_hours;

    return {
      time: entry.time,
      temperature: instant.air_temperature ?? null,
      apparentTemperature: computeApparentTemperature(
        instant.air_temperature ?? null,
        instant.wind_speed ?? null
      ),
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
