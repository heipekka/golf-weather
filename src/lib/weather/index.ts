import { aggregateForecasts } from "./aggregate";
import { fetchFmi } from "./fmi";
import { fetchOpenMeteo } from "./open-meteo";
import type { CourseWeather, SourceForecast, SourceId } from "./types";
import { fetchYr } from "./yr";

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_ENABLED = true;
const cache = new Map<string, { expiresAt: number; data: CourseWeather }>();

const SOURCE_LABELS: Record<SourceId, string> = {
  fmi: "FMI (Ilmatieteen laitos)",
  yr: "YR.no (MET Norway)",
  openmeteo: "Open-Meteo",
};

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

// Bounds how long a single provider can hang before it's treated as failed,
// so a stuck/CORS-blocked request can't keep the whole card on "Loading...".
const REQUEST_TIMEOUT_MS = 10_000;

async function fetchSource(
  id: SourceId,
  lat: number,
  lon: number,
): Promise<SourceForecast> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    switch (id) {
      case "fmi":
        return await fetchFmi(lat, lon, controller.signal);
      case "yr":
        return await fetchYr(lat, lon, controller.signal);
      case "openmeteo":
        return await fetchOpenMeteo(lat, lon, controller.signal);
    }
  } catch (error) {
    // Not shown directly to users (the UI only checks whether this is set),
    // but stored as a translation key path so a caller could resolve it via
    // `t()` if it's ever surfaced.
    return {
      source: id,
      label: SOURCE_LABELS[id],
      hourly: [],
      error: controller.signal.aborted
        ? "errors.forecastTimedOut"
        : error instanceof Error
          ? error.message
          : "errors.failedToLoadForecast",
    };
  } finally {
    clearTimeout(timer);
  }
}

// Fixed column order, independent of arrival order, so the source comparison
// table doesn't reshuffle as providers respond at different speeds.
const SOURCE_ORDER: SourceId[] = ["openmeteo", "yr", "fmi"];

export async function fetchAllSources(
  lat: number,
  lon: number,
  options?: {
    forceRefresh?: boolean;
    onPartial?: (partial: CourseWeather) => void;
  },
): Promise<CourseWeather> {
  const key = cacheKey(lat, lon);
  const cached = cache.get(key);
  if (
    CACHE_ENABLED &&
    !options?.forceRefresh &&
    cached &&
    cached.expiresAt > Date.now()
  ) {
    return cached.data;
  }

  // Each fetchSource() call catches its own errors, so a single failing
  // provider never prevents the others from rendering. As each source
  // resolves, report a partial result so callers can stop showing a
  // loading state as soon as any one source has data, instead of waiting
  // for every source to finish.
  const resolved = new Map<SourceId, SourceForecast>();

  const buildPartial = (): CourseWeather => {
    const sources = SOURCE_ORDER.filter((id) => resolved.has(id)).map(
      (id) => resolved.get(id)!,
    );
    return {
      fetchedAt: new Date().toISOString(),
      sources,
      aggregated: aggregateForecasts(sources),
    };
  };

  await Promise.all(
    SOURCE_ORDER.map(async (id) => {
      const source = await fetchSource(id, lat, lon);
      resolved.set(id, source);
      options?.onPartial?.(buildPartial());
    }),
  );

  const sources = SOURCE_ORDER.map((id) => resolved.get(id)!);
  const data: CourseWeather = {
    fetchedAt: new Date().toISOString(),
    sources,
    aggregated: aggregateForecasts(sources),
  };

  if (CACHE_ENABLED && data.aggregated.length > 0) {
    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data });
  }
  return data;
}

export {
  aggregateForecasts,
  findCurrentPoint,
  hasHourlyData,
  HOUR_ROLLOVER_MINUTE,
  indexByHour
} from "./aggregate";
export * from "./types";

