import type { AggregatedPoint, ForecastPoint, SourceForecast } from './types';

/**
 * Reports whether at least one provider returned points spaced about an
 * hour apart. A provider returning only a handful of points spread further
 * apart (e.g. one per day) means it fell back to daily (not hourly)
 * resolution for the requested location/time, which the UI treats as "no
 * hourly forecast available".
 */
export function hasHourlyData(sources: SourceForecast[]): boolean {
  return sources.some((source) => {
    if (source.error || source.hourly.length < 2) return false;
    return source.hourly.some((point, i) => {
      if (i === 0) return false;
      const gapMs =
        new Date(point.time).getTime() -
        new Date(source.hourly[i - 1].time).getTime();
      return gapMs > 0 && gapMs <= 65 * 60 * 1000;
    });
  });
}

function average(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

function hourKey(isoTime: string): string {
  const date = new Date(isoTime);
  date.setUTCMinutes(0, 0, 0);
  return date.toISOString();
}

export function aggregateForecasts(sources: SourceForecast[]): AggregatedPoint[] {
  const byHour = new Map<string, ForecastPoint[]>();

  for (const source of sources) {
    if (source.error) continue;
    for (const point of source.hourly) {
      const key = hourKey(point.time);
      const bucket = byHour.get(key) ?? [];
      bucket.push(point);
      byHour.set(key, bucket);
    }
  }

  return Array.from(byHour.entries())
    .map(([time, points]) => ({
      time,
      temperature: average(points.map((p) => p.temperature)),
      apparentTemperature: average(points.map((p) => p.apparentTemperature)),
      windSpeed: average(points.map((p) => p.windSpeed)),
      windGust: average(points.map((p) => p.windGust)),
      windDirection: average(points.map((p) => p.windDirection)),
      precipitation: average(points.map((p) => p.precipitation)),
      precipitationProbability: average(points.map((p) => p.precipitationProbability)),
      cloudCover: average(points.map((p) => p.cloudCover)),
      sourceCount: points.length,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Indexes a source's hourly points by normalized hour ISO, so different
 * sources (which may report at slightly different instants) can be looked
 * up by the same hour key and aligned into one table of rows.
 */
export function indexByHour<T extends { time: string }>(points: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const point of points) {
    map.set(hourKey(point.time), point);
  }
  return map;
}

/**
 * Minute of the hour at which the UI rolls over to showing the *next*
 * hour's forecast instead of the current one, so e.g. at 9:45 the 9:00
 * data is no longer displayed and the 10:00 data takes its place.
 */
export const HOUR_ROLLOVER_MINUTE = 45;

/**
 * Picks the point representing "now": the first point at or after the
 * effective current hour, since sources don't all start their series at
 * the same instant. Falls back to the last available point if every point
 * is in the past.
 *
 * Once the wall clock passes `HOUR_ROLLOVER_MINUTE` past the hour, the
 * effective hour advances to the next one, so the soon-to-be-stale hour
 * stops being shown ahead of the top of the hour.
 *
 * Assumes the forecast's hourly points fall on whole UTC hours (true for
 * Finnish courses, which sit on whole-hour UTC offsets), so comparing
 * `now`'s UTC minutes to the rollover threshold matches local wall-clock
 * time.
 */
export function findCurrentPoint<T extends { time: string }>(
  points: T[],
  now: Date = new Date()
): T | null {
  if (points.length === 0) return null;

  const effectiveHour = new Date(now);
  effectiveHour.setUTCMinutes(0, 0, 0);
  if (now.getUTCMinutes() >= HOUR_ROLLOVER_MINUTE) {
    effectiveHour.setUTCHours(effectiveHour.getUTCHours() + 1);
  }
  const effectiveHourIso = effectiveHour.toISOString();

  return points.find((p) => p.time >= effectiveHourIso) ?? points[points.length - 1];
}
