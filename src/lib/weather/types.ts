export type SourceId = 'fmi' | 'yr' | 'openmeteo';

export type ForecastPoint = {
  /** ISO 8601 UTC timestamp. */
  time: string;
  temperature: number | null;
  apparentTemperature: number | null;
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
  /** ISO 8601 timestamp of when this source was last fetched successfully. */
  fetchedAt?: string;
  /**
   * Set when this is a previously fetched forecast being served because the
   * latest attempt failed, so the source stays present (with slightly older
   * numbers) instead of disappearing from the comparison.
   */
  stale?: boolean;
};

export type AggregatedPoint = {
  time: string;
  temperature: number | null;
  apparentTemperature: number | null;
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
