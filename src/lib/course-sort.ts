import type { CourseWeatherState } from "@/hooks/use-courses-weather";
import type { GolfCourseWithDistance } from "@/lib/geo";
import { scoreWindow, type Playability } from "@/lib/golf";
import { isNight } from "@/lib/sun";
import { findCurrentPoint, hasHourlyData } from "@/lib/weather";

/**
 * Legacy discrete sort mode, kept only for migrating old persisted values
 * and `?sort=` deep links to the numeric `weatherWeight` scale (0 = pure
 * location, 1 = pure weather) used everywhere else.
 */
export type SortMode = "location" | "weather" | "combined";

/** Weight assigned to weather when migrating a legacy `SortMode` to the numeric scale. */
const LEGACY_MODE_WEIGHT: Record<SortMode, number> = {
  location: 0,
  weather: 1,
  combined: 0.35,
};

/** Maps a legacy discrete sort mode to its equivalent `weatherWeight`. */
export function weightFromLegacyMode(mode: SortMode): number {
  return LEGACY_MODE_WEIGHT[mode];
}

/** Clamps an arbitrary number into the valid `weatherWeight` range `[0, 1]`. */
export function clampWeight(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Distance beyond which the location score bottoms out at 0. Kept wide
 * (most Finnish courses fall within this) so a blended weight can actually
 * discriminate between a 100 km and a 400 km course instead of both
 * flooring at 0 and collapsing the sort into pure weather ranking.
 */
const MAX_SCORED_DISTANCE_KM = 500;

/** Small blended-weight nudge (max ~a few points) so sunnier courses edge ahead among near-ties. */
const COMBINED_SUNSHINE_WEIGHT = 0.05;

/** Number of upcoming hours considered when scoring a course's playability. */
export const WINDOW_HOURS = 7;

/** Derives the playability of a course over the next WINDOW_HOURS from its weather state, if loaded. */
export function currentPlayability(
  entry: CourseWeatherState | undefined,
  lat: number,
  lon: number,
  now?: Date,
  includeDark = true,
  windLabels = true,
): Playability | null {
  const aggregated = entry?.weather?.aggregated ?? [];
  const current = entry?.weather ? findCurrentPoint(aggregated, now) : null;
  if (!current) return null;

  const startIndex = aggregated.indexOf(current);
  const window = aggregated.slice(startIndex, startIndex + WINDOW_HOURS);

  // A daily-only (one point per day) forecast can have its single point's
  // timestamp fall on a dark hour, which would otherwise falsely label an
  // ordinary daytime day as `Dark`. The window can also collapse to a
  // single point for an hourly source when `now` falls beyond its forecast
  // horizon (e.g. a bookmark set further out than the ~3 days of hourly
  // data), which is the same insufficient-context case even though
  // `hasHourlyData` is true.
  const hourly = !!entry?.weather && hasHourlyData(entry.weather.sources);
  const enoughContext = hourly && window.length > 1;

  return scoreWindow(
    window.map((point) => ({
      temperature: point.temperature,
      windSpeed: point.windSpeed,
      windGust: point.windGust,
      precipitation: point.precipitation,
      precipitationProbability: point.precipitationProbability,
      cloudCover: point.cloudCover,
      isDark: includeDark && enoughContext && isNight(point.time, lat, lon),
    })),
    windLabels,
  );
}

/** Normalizes distance to a 0-100 score, where nearer is better. */
export function distanceScore(distanceKm: number): number {
  return Math.max(0, 100 - (distanceKm / MAX_SCORED_DISTANCE_KM) * 100);
}

/**
 * Estimates "sunshine" over the same WINDOW_HOURS window used for
 * playability, as 100 minus the average cloud cover across daylight hours
 * only (cloud cover during dark hours doesn't affect perceived sunshine).
 * Returns null when the window hasn't loaded or has no daylight hours with
 * cloud cover data.
 */
export function windowSunshine(
  entry: CourseWeatherState | undefined,
  lat: number,
  lon: number,
  now?: Date,
): number | null {
  const aggregated = entry?.weather?.aggregated ?? [];
  const current = entry?.weather ? findCurrentPoint(aggregated, now) : null;
  if (!current) return null;

  const startIndex = aggregated.indexOf(current);
  const window = aggregated.slice(startIndex, startIndex + WINDOW_HOURS);
  const clouds = window
    .filter((point) => !isNight(point.time, lat, lon))
    .map((point) => point.cloudCover)
    .filter((c): c is number => c !== null && Number.isFinite(c));
  if (clouds.length === 0) return null;

  return 100 - clouds.reduce((sum, c) => sum + c, 0) / clouds.length;
}

/**
 * Ranks courses by a blend of proximity and current playability.
 * `weatherWeight` is `0` for pure location, `1` for pure weather, and
 * anything in between blends `distanceScore` and `playability.score`
 * proportionally (with a small sunshine tie-break nudge throughout).
 */
export function sortCourses(
  courses: GolfCourseWithDistance[],
  weatherByCourse: Record<string, CourseWeatherState>,
  weatherWeight: number,
  now?: Date,
  includeDark = true,
): GolfCourseWithDistance[] {
  const weight = clampWeight(weatherWeight);

  if (weight === 0) {
    return [...courses].sort((a, b) => a.distanceKm - b.distanceKm);
  }

  const playabilityById = new Map<string, Playability | null>(
    courses.map((course) => [
      course.id,
      currentPlayability(weatherByCourse[course.id], course.lat, course.lon, now, includeDark),
    ]),
  );

  const sunshineById = new Map<string, number | null>(
    courses.map((course) => [
      course.id,
      windowSunshine(weatherByCourse[course.id], course.lat, course.lon, now),
    ]),
  );

  const rankScore = (course: GolfCourseWithDistance): number | null => {
    const playability = playabilityById.get(course.id) ?? null;
    if (!playability) return null;

    if (weight === 1) return playability.score;

    const sunshine = sunshineById.get(course.id) ?? null;
    const sunTerm =
      sunshine === null
        ? 0
        : COMBINED_SUNSHINE_WEIGHT *
          (sunshine - 50) *
          (playability.label === "Hot" ? -1 : 1);

    return (
      (1 - weight) * distanceScore(course.distanceKm) +
      weight * playability.score +
      sunTerm
    );
  };

  return [...courses].sort((a, b) => {
    const scoreA = rankScore(a);
    const scoreB = rankScore(b);

    // Courses whose weather hasn't loaded yet sink to the bottom, ordered by distance.
    if (scoreA === null && scoreB === null) return a.distanceKm - b.distanceKm;
    if (scoreA === null) return 1;
    if (scoreB === null) return -1;

    if (scoreA === scoreB && weight === 1) {
      const sunA = sunshineById.get(a.id) ?? null;
      const sunB = sunshineById.get(b.id) ?? null;
      if (sunA === null && sunB === null) return a.distanceKm - b.distanceKm;
      if (sunA === null) return 1;
      if (sunB === null) return -1;

      const label = playabilityById.get(a.id)?.label;
      return label === "Hot" ? sunA - sunB : sunB - sunA;
    }

    return scoreB - scoreA;
  });
}
