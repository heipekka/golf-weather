import type { Coordinates } from "@/lib/geo";

import { aggregateForecasts } from "./aggregate";
import {
  ensureHydrated,
  getInFlight,
  readFresh,
  readStale,
  resolveSource,
  settle,
  trackInFlight,
} from "./cache";
import { fetchFmi } from "./fmi";
import { fetchOpenMeteo, fetchOpenMeteoBatch } from "./open-meteo";
import { isTimeoutError } from "./request";
import type { CourseWeather, SourceForecast, SourceId } from "./types";
import { fetchYr } from "./yr";

const SOURCE_LABELS: Record<SourceId, string> = {
  fmi: "FMI (Ilmatieteen laitos)",
  yr: "YR.no (MET Norway)",
  openmeteo: "Open-Meteo",
};

// Fixed column order, independent of arrival order, so the source comparison
// table doesn't reshuffle as providers respond at different speeds.
const SOURCE_ORDER: SourceId[] = ["openmeteo", "yr", "fmi"];

/** Sources fetched one course at a time; Open-Meteo is batched separately. */
const PER_COURSE_SOURCES: SourceId[] = ["yr", "fmi"];

/**
 * Describes a failed fetch. The message is a translation key path rather than
 * user-facing text, so a caller could resolve it via `t()` if it's ever shown
 * (today the UI only checks whether this is set).
 */
function toErrorForecast(id: SourceId, error: unknown): SourceForecast {
  return {
    source: id,
    label: SOURCE_LABELS[id],
    hourly: [],
    error: isTimeoutError(error)
      ? "errors.forecastTimedOut"
      : error instanceof Error
        ? error.message
        : "errors.failedToLoadForecast",
  };
}

/** Fetches one source for one course, reporting failure as data rather than throwing. */
async function fetchSource(id: SourceId, lat: number, lon: number): Promise<SourceForecast> {
  try {
    switch (id) {
      case "fmi":
        return await fetchFmi(lat, lon);
      case "yr":
        return await fetchYr(lat, lon);
      case "openmeteo":
        return await fetchOpenMeteo(lat, lon);
    }
  } catch (error) {
    return toErrorForecast(id, error);
  }
}

function buildWeather(resolved: Map<SourceId, SourceForecast>): CourseWeather {
  const sources = SOURCE_ORDER.filter((id) => resolved.has(id)).map((id) => resolved.get(id)!);
  return {
    fetchedAt: new Date().toISOString(),
    sources,
    aggregated: aggregateForecasts(sources),
  };
}

export async function fetchAllSources(
  lat: number,
  lon: number,
  options?: {
    forceRefresh?: boolean;
    onPartial?: (partial: CourseWeather) => void;
  },
): Promise<CourseWeather> {
  const resolved = new Map<SourceId, SourceForecast>();
  const report = () => options?.onPartial?.(buildWeather(resolved));

  // Each source resolves independently, so one failing provider never prevents
  // the others from rendering, and partials let callers drop their loading
  // state as soon as any one source has data.
  await Promise.all(
    SOURCE_ORDER.map(async (id) => {
      const forecast = await resolveSource(lat, lon, id, () => fetchSource(id, lat, lon), {
        forceRefresh: options?.forceRefresh,
        onStale: (stale) => {
          resolved.set(id, stale);
          report();
        },
      });
      resolved.set(id, forecast);
      report();
    }),
  );

  return buildWeather(resolved);
}

/**
 * Resolves Open-Meteo for many courses using as few requests as possible: the
 * provider accepts comma-separated coordinates, so a whole list costs one
 * request instead of one per course. Returns a promise per input point, in the
 * same order, none of which reject.
 */
function resolveOpenMeteoForAll(
  points: Coordinates[],
  forceRefresh: boolean,
): Promise<SourceForecast>[] {
  const resolved = new Array<Promise<SourceForecast>>(points.length);
  const needed: number[] = [];

  points.forEach((point, index) => {
    if (!forceRefresh) {
      const fresh = readFresh(point.lat, point.lon, "openmeteo");
      if (fresh) {
        resolved[index] = Promise.resolve(fresh);
        return;
      }
    }

    // Join a request another screen already started rather than duplicating it.
    const pending = getInFlight(point.lat, point.lon, "openmeteo");
    if (pending) {
      resolved[index] = pending;
      return;
    }

    needed.push(index);
  });

  if (needed.length > 0) {
    const batch = fetchOpenMeteoBatch(needed.map((index) => points[index]));

    needed.forEach((pointIndex, batchIndex) => {
      const { lat, lon } = points[pointIndex];
      resolved[pointIndex] = trackInFlight(
        lat,
        lon,
        "openmeteo",
        batch.then(
          (forecasts) =>
            settle(
              lat,
              lon,
              "openmeteo",
              forecasts[batchIndex] ?? toErrorForecast("openmeteo", null),
            ),
          (error) => settle(lat, lon, "openmeteo", toErrorForecast("openmeteo", error)),
        ),
      );
    });
  }

  return resolved;
}

/**
 * Fetches weather for a whole list of courses, batching Open-Meteo into a
 * single request and fanning the remaining providers out under the shared
 * per-provider concurrency caps in [request.ts](./request.ts). Results are
 * returned in input order, and `onPartial` reports each course as its sources
 * arrive so the list can render progressively.
 */
export async function fetchCoursesWeather(
  points: Coordinates[],
  options?: {
    forceRefresh?: boolean;
    onPartial?: (index: number, partial: CourseWeather) => void;
  },
): Promise<CourseWeather[]> {
  if (points.length === 0) return [];
  await ensureHydrated();

  const forceRefresh = options?.forceRefresh ?? false;
  const resolvedByCourse = points.map(() => new Map<SourceId, SourceForecast>());
  const report = (index: number) =>
    options?.onPartial?.(index, buildWeather(resolvedByCourse[index]));

  // Paint last-known-good values before any request finishes, so a cold start
  // or a refresh shows numbers immediately instead of empty cards.
  points.forEach((point, index) => {
    let seeded = false;
    for (const id of SOURCE_ORDER) {
      if (readFresh(point.lat, point.lon, id)) continue;
      const stale = readStale(point.lat, point.lon, id);
      if (!stale) continue;
      resolvedByCourse[index].set(id, stale);
      seeded = true;
    }
    if (seeded) report(index);
  });

  const openMeteo = resolveOpenMeteoForAll(points, forceRefresh);

  const record = async (index: number, id: SourceId, request: Promise<SourceForecast>) => {
    try {
      resolvedByCourse[index].set(id, await request);
    } catch (error) {
      resolvedByCourse[index].set(id, toErrorForecast(id, error));
    }
    report(index);
  };

  await Promise.all(
    points.flatMap((point, index) => [
      record(index, "openmeteo", openMeteo[index]),
      ...PER_COURSE_SOURCES.map((id) =>
        record(
          index,
          id,
          resolveSource(point.lat, point.lon, id, () => fetchSource(id, point.lat, point.lon), {
            forceRefresh,
          }),
        ),
      ),
    ]),
  );

  return resolvedByCourse.map(buildWeather);
}

export {
  aggregateForecasts,
  findCurrentPoint,
  hasHourlyData,
  HOUR_ROLLOVER_MINUTE,
  indexByHour,
} from "./aggregate";
export * from "./types";
