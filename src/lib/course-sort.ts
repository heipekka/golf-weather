import type { CourseWeatherState } from "@/hooks/use-courses-weather";
import type { GolfCourseWithDistance } from "@/lib/geo";
import { scoreWindow, type Playability } from "@/lib/golf";
import { isNight } from "@/lib/sun";
import { findCurrentPoint } from "@/lib/weather";

export type SortMode = "location" | "weather" | "combined";

export const SortModeLabels: Record<SortMode, string> = {
  location: "Location",
  weather: "Best weather",
  combined: "Combined",
};

/**
 * Distance beyond which the location score bottoms out at 0. Kept wide
 * (most Finnish courses fall within this) so `combined` mode can actually
 * discriminate between a 100 km and a 400 km course instead of both
 * flooring at 0 and collapsing the sort into pure weather ranking.
 */
const MAX_SCORED_DISTANCE_KM = 500;

/** Weights for `combined` mode: distance dominates, weather only breaks ties among similarly-close courses. */
const COMBINED_DISTANCE_WEIGHT = 0.65;
const COMBINED_WEATHER_WEIGHT = 0.35;

/** Small combined-mode nudge (max ~a few points) so sunnier courses edge ahead among near-ties. */
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
): Playability | null {
  const aggregated = entry?.weather?.aggregated ?? [];
  const current = entry?.weather ? findCurrentPoint(aggregated, now) : null;
  if (!current) return null;

  const startIndex = aggregated.indexOf(current);
  const window = aggregated.slice(startIndex, startIndex + WINDOW_HOURS);

  return scoreWindow(
    window.map((point) => ({
      temperature: point.temperature,
      windSpeed: point.windSpeed,
      windGust: point.windGust,
      precipitation: point.precipitation,
      precipitationProbability: point.precipitationProbability,
      cloudCover: point.cloudCover,
      isDark: includeDark && isNight(point.time, lat, lon),
    })),
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

export function sortCourses(
  courses: GolfCourseWithDistance[],
  weatherByCourse: Record<string, CourseWeatherState>,
  mode: SortMode,
  now?: Date,
  includeDark = true,
): GolfCourseWithDistance[] {
  if (mode === "location") {
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

    if (mode === "weather") return playability.score;

    const sunshine = sunshineById.get(course.id) ?? null;
    const sunTerm =
      sunshine === null
        ? 0
        : COMBINED_SUNSHINE_WEIGHT *
          (sunshine - 50) *
          (playability.label === "Hot" ? -1 : 1);

    return (
      COMBINED_DISTANCE_WEIGHT * distanceScore(course.distanceKm) +
      COMBINED_WEATHER_WEIGHT * playability.score +
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

    if (scoreA === scoreB && mode === "weather") {
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
