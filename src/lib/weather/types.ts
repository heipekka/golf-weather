export type SourceId = 'fmi' | 'yr' | 'openmeteo';

export type ForecastPoint = {
  /** ISO 8601 UTC timestamp. */
  time: string;
  temperature: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirection: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  cloudCover: number | null;
  weatherCode: number | null;
  /** MET Norway symbol code, e.g. "partlycloudy_day". */
  symbol: string | null;
};

export type SourceForecast = {
  source: SourceId;
  label: string;
  hourly: ForecastPoint[];
  error?: string;
};

export type AggregatedPoint = {
  time: string;
  temperature: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirection: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  cloudCover: number | null;
  sourceCount: number;
};

export type CourseWeather = {
  fetchedAt: string;
  sources: SourceForecast[];
  aggregated: AggregatedPoint[];
};
