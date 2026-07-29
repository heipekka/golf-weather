import type { CourseWeatherState } from "@/hooks/use-courses-weather";
import { currentPlayability } from "@/lib/course-sort";
import { haversineKm, type GolfCourse, type GolfCourseWithDistance } from "@/lib/geo";
import { FAIR_TIER_RANK, playabilityRank, type Playability } from "@/lib/golf";

/** How far from the booked course an alternative may be. */
export const ALTERNATIVE_RADIUS_KM = 100;

/**
 * Cap on how many nearby courses are considered per poor tee time. Each
 * candidate costs a forecast fetch, so only the nearest few are checked.
 */
export const MAX_ALTERNATIVE_CANDIDATES = 5;

/** Tee times further out than this are left alone; forecasts that far ahead aren't worth acting on. */
export const ALTERNATIVE_LOOKAHEAD_HOURS = 48;

const MS_PER_HOUR = 60 * 60 * 1000;

export type TeeTimeAlternative = {
  /** `distanceKm` is measured from the booked course, not from the user. */
  course: GolfCourseWithDistance;
  playability: Playability;
};

/**
 * True when `teeTime` falls inside the lookahead window. The window starts at
 * the top of `now`'s hour, since tee times are floored to the hour and a "now"
 * tee time is the current one.
 */
export function isWithinLookahead(teeTime: Date, now: Date): boolean {
  const time = teeTime.getTime();
  if (Number.isNaN(time)) return false;
  const start = new Date(now).setMinutes(0, 0, 0);
  return time >= start && time <= start + ALTERNATIVE_LOOKAHEAD_HOURS * MS_PER_HOUR;
}

/**
 * True when a tee time's conditions are poor enough to look for somewhere
 * better. `Dark` is deliberately excluded: every course within the radius
 * shares essentially the same daylight, so the search could never turn up a
 * better option and would only spend forecast fetches.
 */
export function needsAlternatives(playability: Playability | null): boolean {
  if (!playability || playability.label === "Dark") return false;
  return playabilityRank(playability.label) <= FAIR_TIER_RANK;
}

/** The nearest courses within `ALTERNATIVE_RADIUS_KM` of `course`, excluding itself. */
export function candidatesFor(
  course: GolfCourse,
  allCourses: GolfCourse[],
): GolfCourseWithDistance[] {
  return allCourses
    .filter((candidate) => candidate.id !== course.id)
    .map((candidate) => ({ ...candidate, distanceKm: haversineKm(course, candidate) }))
    .filter((candidate) => candidate.distanceKm <= ALTERNATIVE_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_ALTERNATIVE_CANDIDATES);
}

/**
 * Scores each candidate over the same window the tee time's own badge uses,
 * keeps only those a whole tier better, and ranks them best-first.
 */
export function rankAlternatives(
  candidates: GolfCourseWithDistance[],
  weatherByCourse: Record<string, CourseWeatherState>,
  teeTime: Date,
  original: Playability,
  includeDark = true,
  windLabels = true,
): TeeTimeAlternative[] {
  const originalRank = playabilityRank(original.label);

  return candidates
    .map((course) => ({
      course,
      playability: currentPlayability(
        weatherByCourse[course.id],
        course.lat,
        course.lon,
        teeTime,
        includeDark,
        windLabels,
      ),
    }))
    .filter(
      (entry): entry is TeeTimeAlternative =>
        !!entry.playability && playabilityRank(entry.playability.label) > originalRank,
    )
    .sort(
      (a, b) =>
        b.playability.score - a.playability.score ||
        a.course.distanceKm - b.course.distanceKm,
    );
}
