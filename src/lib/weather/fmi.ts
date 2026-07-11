import { XMLParser } from 'fast-xml-parser';

import { computeApparentTemperature } from './feels-like';
import type { ForecastPoint, SourceForecast } from './types';

const FMI_WFS_URL = 'https://opendata.fmi.fi/wfs';
const STORED_QUERY_ID = 'fmi::forecast::harmonie::surface::point::simple';
const PARAMETERS = [
  'Temperature',
  'WindSpeedMS',
  'WindGust',
  'WindDirection',
  'Precipitation1h',
  'TotalCloudCover',
];

const parser = new XMLParser({ removeNSPrefix: true, ignoreAttributes: true });

type FmiElement = {
  Time: string;
  ParameterName: string;
  ParameterValue: number | string;
};

type FmiMember = {
  BsWfsElement: FmiElement;
};

type FmiFeatureCollection = {
  FeatureCollection?: {
    member?: FmiMember | FmiMember[];
  };
};

function toNumber(value: number | string | undefined): number | null {
  if (value === undefined) return null;
  const num = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(num) ? num : null;
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export async function fetchFmi(lat: number, lon: number, signal?: AbortSignal): Promise<SourceForecast> {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'getFeature',
    storedquery_id: STORED_QUERY_ID,
    latlon: `${lat},${lon}`,
    parameters: PARAMETERS.join(','),
    timestep: '60',
  });

  const response = await fetch(`${FMI_WFS_URL}?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`FMI request failed with status ${response.status}`);
  }

  const xmlText = await response.text();
  const parsed = parser.parse(xmlText) as FmiFeatureCollection;
  const members = toArray(parsed.FeatureCollection?.member);

  const byTime = new Map<string, Partial<ForecastPoint> & { time: string }>();

  for (const member of members) {
    const element = member.BsWfsElement;
    if (!element?.Time) continue;

    const point = byTime.get(element.Time) ?? { time: element.Time };
    const value = toNumber(element.ParameterValue);

    switch (element.ParameterName) {
      case 'Temperature':
        point.temperature = value;
        break;
      case 'WindSpeedMS':
        point.windSpeed = value;
        break;
      case 'WindGust':
        point.windGust = value;
        break;
      case 'WindDirection':
        point.windDirection = value;
        break;
      case 'Precipitation1h':
        point.precipitation = value;
        break;
      case 'TotalCloudCover':
        point.cloudCover = value;
        break;
      default:
        break;
    }

    byTime.set(element.Time, point);
  }

  const hourly: ForecastPoint[] = Array.from(byTime.values())
    .map((point) => ({
      time: point.time,
      temperature: point.temperature ?? null,
      apparentTemperature: computeApparentTemperature(point.temperature ?? null, point.windSpeed ?? null),
      windSpeed: point.windSpeed ?? null,
      windGust: point.windGust ?? null,
      windDirection: point.windDirection ?? null,
      precipitation: point.precipitation ?? null,
      precipitationProbability: null,
      cloudCover: point.cloudCover ?? null,
      weatherCode: null,
      symbol: null,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  return { source: 'fmi', label: 'FMI (Ilmatieteen laitos)', hourly };
}
