import type { CourseWeatherState } from "@/hooks/use-courses-weather";
import type { GolfCourseWithDistance } from "@/lib/geo";
import {
  scoreWindow,
  type Playability,
  type PlayabilityLabel,
} from "@/lib/golf";
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

/**
 * Weather score used only by `combined` mode. Deliberately compresses the
 * top of the scale so Excellent and Good are nearly interchangeable —
 * otherwise a marginally nicer forecast far away could still outrank a
 * merely-good course nearby.
 */
const COMBINED_WEATHER_SCORE: Record<PlayabilityLabel, number> = {
  Excellent: 100,
  Hot: 90,
  Good: 80,
  Fair: 55,
  Poor: 25,
  Bad: 5,
};

/** Number of upcoming hours considered when scoring a course's playability. */
export const WINDOW_HOURS = 7;

/** Derives the playability of a course over the next WINDOW_HOURS from its weather state, if loaded. */
export function currentPlayability(
  entry: CourseWeatherState | undefined,
): Playability | null {
  const aggregated = entry?.weather?.aggregated ?? [];
  const current = entry?.weather ? findCurrentPoint(aggregated) : null;
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
    })),
  );
}

/** Normalizes distance to a 0-100 score, where nearer is better. */
export function distanceScore(distanceKm: number): number {
  return Math.max(0, 100 - (distanceKm / MAX_SCORED_DISTANCE_KM) * 100);
}

export function sortCourses(
  courses: GolfCourseWithDistance[],
  weatherByCourse: Record<string, CourseWeatherState>,
  mode: SortMode,
): GolfCourseWithDistance[] {
  if (mode === "location") {
    return [...courses].sort((a, b) => a.distanceKm - b.distanceKm);
  }

  const playabilityById = new Map<string, Playability | null>(
    courses.map((course) => [
      course.id,
      currentPlayability(weatherByCourse[course.id]),
    ]),
  );

  const rankScore = (course: GolfCourseWithDistance): number | null => {
    const playability = playabilityById.get(course.id) ?? null;
    if (!playability) return null;

    if (mode === "weather") return playability.score;
    return (
      COMBINED_DISTANCE_WEIGHT * distanceScore(course.distanceKm) +
      COMBINED_WEATHER_WEIGHT * COMBINED_WEATHER_SCORE[playability.label]
    );
  };

  return [...courses].sort((a, b) => {
    const scoreA = rankScore(a);
    const scoreB = rankScore(b);

    // Courses whose weather hasn't loaded yet sink to the bottom, ordered by distance.
    if (scoreA === null && scoreB === null) return a.distanceKm - b.distanceKm;
    if (scoreA === null) return 1;
    if (scoreB === null) return -1;

    return scoreB - scoreA;
  });
}
