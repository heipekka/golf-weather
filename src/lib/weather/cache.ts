import { loadPersisted, schedulePersist, type PersistedEntry } from './persist';
import type { SourceForecast, SourceId } from './types';

/** How long a fetched source counts as fresh before it's refetched. */
const TTL_MS = 15 * 60 * 1000;

/** Roughly 250 courses across three providers. */
const MAX_ENTRIES = 750;

type Entry = {
  fetchedAt: number;
  expiresAt: number;
  forecast: SourceForecast;
};

/**
 * Cached forecasts keyed per course *and* per source, so a provider that fails
 * can be retried on its own instead of being locked out by whichever siblings
 * happened to succeed alongside it.
 *
 * Iteration order is write order: a stored entry moves to the end, and
 * eviction takes from the front. Reads deliberately don't reorder, so the
 * order stays meaningful for persistence (see `selectEntries` in
 * [persist.ts](./persist.ts)), which relies on courses appearing in the order
 * they were requested.
 */
const entries = new Map<string, Entry>();

/**
 * Requests currently in flight, so several screens asking for the same course
 * and source at the same moment (e.g. every mounted tab reacting to the same
 * hour rollover) share one upstream request instead of racing.
 */
const inFlight = new Map<string, Promise<SourceForecast>>();

/** Matches the precision courses are distinguished by, ~100 m. */
export function courseKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

function keyFor(lat: number, lon: number, source: SourceId): string {
  return `${courseKey(lat, lon)}|${source}`;
}

function snapshot(): PersistedEntry[] {
  return Array.from(entries.entries()).map(([key, entry]) => ({
    key,
    fetchedAt: entry.fetchedAt,
    expiresAt: entry.expiresAt,
    forecast: entry.forecast,
  }));
}

let hydration: Promise<void> | null = null;

/**
 * Loads the persisted cache once per session. Everything that reads the cache
 * awaits this first, so a cold start can serve last-known-good data instead of
 * showing empty cards while the network catches up.
 */
export function ensureHydrated(): Promise<void> {
  hydration ??= loadPersisted()
    .then((persisted) => {
      for (const entry of persisted) {
        // Anything fetched during this session is newer by definition.
        if (entries.has(entry.key)) continue;
        entries.set(entry.key, {
          fetchedAt: entry.fetchedAt,
          expiresAt: entry.expiresAt,
          forecast: entry.forecast,
        });
      }
    })
    .catch(() => {});
  return hydration;
}

/** Returns the cached forecast only while it's still within its TTL. */
export function readFresh(lat: number, lon: number, source: SourceId): SourceForecast | null {
  const entry = entries.get(keyFor(lat, lon, source));
  if (!entry || entry.expiresAt <= Date.now()) return null;
  return entry.forecast;
}

/**
 * Returns the cached forecast even if expired, flagged as stale. Used both to
 * paint something immediately while a refresh runs, and as the fallback when a
 * refresh fails.
 */
export function readStale(lat: number, lon: number, source: SourceId): SourceForecast | null {
  const entry = entries.get(keyFor(lat, lon, source));
  if (!entry) return null;
  return { ...entry.forecast, stale: true };
}

function store(
  lat: number,
  lon: number,
  source: SourceId,
  forecast: SourceForecast
): SourceForecast {
  const now = Date.now();
  // Built field by field rather than spread, so a cached entry can never carry
  // an `error` or `stale` flag from whatever produced it.
  const stored: SourceForecast = {
    source: forecast.source,
    label: forecast.label,
    hourly: forecast.hourly,
    fetchedAt: new Date(now).toISOString(),
  };

  // Re-inserting moves the entry to the end, keeping write order intact.
  const key = keyFor(lat, lon, source);
  entries.delete(key);
  entries.set(key, {
    fetchedAt: now,
    expiresAt: now + TTL_MS,
    forecast: stored,
  });

  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next();
    if (oldest.done) break;
    entries.delete(oldest.value);
  }

  schedulePersist(snapshot);
  return stored;
}

/**
 * Records the outcome of a fetch and returns what callers should display.
 *
 * A successful forecast is cached and returned. A failed one falls back to the
 * previous value for that source when there is one, deliberately *without* the
 * error set, so the source stays in the aggregate and the comparison table
 * with slightly older numbers rather than vanishing. Only a source that has
 * never been fetched successfully surfaces as an error.
 */
export function settle(
  lat: number,
  lon: number,
  source: SourceId,
  forecast: SourceForecast
): SourceForecast {
  const failed = !!forecast.error || forecast.hourly.length === 0;
  if (!failed) return store(lat, lon, source, forecast);

  return readStale(lat, lon, source) ?? forecast;
}

export function getInFlight(
  lat: number,
  lon: number,
  source: SourceId
): Promise<SourceForecast> | undefined {
  return inFlight.get(keyFor(lat, lon, source));
}

/**
 * Registers an in-flight request so concurrent callers can join it, clearing
 * the registration once it settles. Returns the same promise for chaining.
 */
export function trackInFlight(
  lat: number,
  lon: number,
  source: SourceId,
  request: Promise<SourceForecast>
): Promise<SourceForecast> {
  const key = keyFor(lat, lon, source);
  const tracked = request.finally(() => {
    if (inFlight.get(key) === tracked) inFlight.delete(key);
  });
  inFlight.set(key, tracked);
  return tracked;
}

/**
 * Resolves one source for one course through the cache: serves a fresh value,
 * joins an identical request already in flight, or fetches. `onStale` is
 * invoked with an expired value before fetching, so callers can render
 * something immediately while the refresh runs.
 */
export async function resolveSource(
  lat: number,
  lon: number,
  source: SourceId,
  fetcher: () => Promise<SourceForecast>,
  options?: {
    forceRefresh?: boolean;
    onStale?: (forecast: SourceForecast) => void;
  }
): Promise<SourceForecast> {
  await ensureHydrated();

  if (!options?.forceRefresh) {
    const fresh = readFresh(lat, lon, source);
    if (fresh) return fresh;
  }

  const pending = getInFlight(lat, lon, source);
  if (pending) return pending;

  if (options?.onStale) {
    const stale = readStale(lat, lon, source);
    if (stale) options.onStale(stale);
  }

  return trackInFlight(
    lat,
    lon,
    source,
    fetcher().then((forecast) => settle(lat, lon, source, forecast))
  );
}
