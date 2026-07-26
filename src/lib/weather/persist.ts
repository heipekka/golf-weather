import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import type { ForecastPoint, SourceForecast, SourceId } from './types';

const STORAGE_KEY = 'golf-weather.forecastCache.v1';

/**
 * Hourly points kept per source. The list screen shows seven and the detail
 * screen about two days, so trimming the ~72 fetched points to 48 halves the
 * stored payload with no visible loss.
 */
const MAX_PERSISTED_HOURS = 48;

/**
 * Distinct courses kept, most recently used first. A full forecast is ~62 KB
 * of plain JSON per course, and AsyncStorage is backed by localStorage on web
 * with a ceiling around 5 MB, so the cache has to stay deliberately bounded
 * rather than mirroring everything held in memory.
 */
const MAX_PERSISTED_COURSES = 80;

/** Hard ceiling on the encoded payload, enforced by dropping oldest entries. */
const MAX_PERSISTED_BYTES = 1_500_000;

/** Beyond this age a forecast isn't worth restoring, even as a fallback. */
const MAX_PERSISTED_AGE_MS = 24 * 60 * 60 * 1000;

/** Trailing debounce on writes; serializing hundreds of entries isn't free. */
const WRITE_DEBOUNCE_MS = 5000;

export type PersistedEntry = {
  /** `${lat},${lon}|${source}` as produced by the cache. */
  key: string;
  fetchedAt: number;
  expiresAt: number;
  forecast: SourceForecast;
};

/**
 * Decimal places kept per numeric field. Forecast precision beyond this is
 * noise, and shorter numbers are the single biggest win in the encoded size.
 */
const DECIMALS = {
  temperature: 1,
  apparentTemperature: 1,
  windSpeed: 1,
  windGust: 1,
  windDirection: 0,
  precipitation: 1,
  precipitationProbability: 0,
  cloudCover: 0,
  weatherCode: 0,
} as const;

type NumericField = keyof typeof DECIMALS;

const NUMERIC_FIELDS = Object.keys(DECIMALS) as NumericField[];

type Column = (number | null)[];

/**
 * One source's forecast, stored column-wise: field names appear once for the
 * whole series instead of once per hour, and repeated symbol codes collapse
 * into a shared dictionary. Times are minute offsets from `startMs`, since
 * providers don't all emit strictly hourly steps.
 */
type EncodedEntry = {
  k: string;
  f: number;
  e: number;
  l: string;
  /** Epoch ms of the first point. */
  t: number;
  /** Minute offsets from `t`, one per point. */
  o: number[];
  /** One column per entry in NUMERIC_FIELDS, in that order. */
  c: Column[];
  /** Indices into the shared symbol dictionary; -1 for no symbol. */
  s: number[];
};

type EncodedPayload = {
  v: 1;
  /** Shared symbol dictionary, e.g. "partlycloudy_day". */
  d: string[];
  e: EncodedEntry[];
};

function round(value: number | null, decimals: number): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function encodeEntry(entry: PersistedEntry, symbols: Map<string, number>): EncodedEntry | null {
  const points = entry.forecast.hourly.slice(0, MAX_PERSISTED_HOURS);
  if (points.length === 0) return null;

  const startMs = Date.parse(points[0].time);
  if (!Number.isFinite(startMs)) return null;

  const offsets: number[] = [];
  const symbolIndices: number[] = [];
  for (const point of points) {
    const ms = Date.parse(point.time);
    offsets.push(Number.isFinite(ms) ? Math.round((ms - startMs) / 60_000) : 0);

    const symbol = point.symbol;
    if (symbol === null) {
      symbolIndices.push(-1);
    } else {
      let index = symbols.get(symbol);
      if (index === undefined) {
        index = symbols.size;
        symbols.set(symbol, index);
      }
      symbolIndices.push(index);
    }
  }

  const columns = NUMERIC_FIELDS.map((field) =>
    points.map((point) => round(point[field], DECIMALS[field]))
  );

  return {
    k: entry.key,
    f: entry.fetchedAt,
    e: entry.expiresAt,
    l: entry.forecast.label,
    t: startMs,
    o: offsets,
    c: columns,
    s: symbolIndices,
  };
}

function decodeEntry(encoded: EncodedEntry, dictionary: string[]): PersistedEntry | null {
  const source = encoded.k.split('|')[1] as SourceId | undefined;
  if (source !== 'fmi' && source !== 'yr' && source !== 'openmeteo') return null;
  if (!Array.isArray(encoded.o) || !Array.isArray(encoded.c)) return null;

  const columnByField = new Map<NumericField, Column>();
  NUMERIC_FIELDS.forEach((field, index) => {
    columnByField.set(field, encoded.c[index] ?? []);
  });

  const hourly: ForecastPoint[] = encoded.o.map((offset, i) => {
    const read = (field: NumericField) => columnByField.get(field)?.[i] ?? null;
    const symbolIndex = encoded.s?.[i] ?? -1;

    return {
      time: new Date(encoded.t + offset * 60_000).toISOString(),
      temperature: read('temperature'),
      apparentTemperature: read('apparentTemperature'),
      windSpeed: read('windSpeed'),
      windGust: read('windGust'),
      windDirection: read('windDirection'),
      precipitation: read('precipitation'),
      precipitationProbability: read('precipitationProbability'),
      cloudCover: read('cloudCover'),
      weatherCode: read('weatherCode'),
      symbol: symbolIndex >= 0 ? (dictionary[symbolIndex] ?? null) : null,
    };
  });

  const forecast: SourceForecast = {
    source,
    label: encoded.l,
    hourly,
    fetchedAt: new Date(encoded.f).toISOString(),
  };

  return { key: encoded.k, fetchedAt: encoded.f, expiresAt: encoded.e, forecast };
}

/**
 * Groups timestamps by the minute so a single list load — whose entries are
 * written seconds apart — counts as one batch.
 */
function fetchBatch(timestamp: number): number {
  return Math.floor(timestamp / 60_000);
}

/**
 * Narrows the full in-memory cache to what's worth persisting, keeping all of a
 * course's sources together so a restored course isn't missing providers.
 *
 * Priority is the most recent load first, and within a load the order the
 * courses were requested in. Since lists are sorted by distance, that keeps the
 * courses nearest the user — the ones they'll see first on the next cold start.
 * The sort is stable, which is what preserves request order within a batch.
 */
function selectEntries(all: PersistedEntry[]): PersistedEntry[] {
  const byRecency = [...all].sort((a, b) => fetchBatch(b.fetchedAt) - fetchBatch(a.fetchedAt));

  const courses = new Set<string>();
  const selected: PersistedEntry[] = [];

  for (const entry of byRecency) {
    const course = entry.key.split('|')[0];
    if (!courses.has(course)) {
      if (courses.size >= MAX_PERSISTED_COURSES) continue;
      courses.add(course);
    }
    selected.push(entry);
  }

  return selected;
}

function encodePayload(entries: PersistedEntry[]): string {
  const symbols = new Map<string, number>();
  const encoded = entries
    .map((entry) => encodeEntry(entry, symbols))
    .filter((entry): entry is EncodedEntry => entry !== null);

  const payload: EncodedPayload = {
    v: 1,
    d: Array.from(symbols.keys()),
    e: encoded,
  };
  return JSON.stringify(payload);
}

/**
 * Encodes within the byte budget, dropping the lowest-priority entries and
 * re-encoding until it fits. The symbol dictionary is shared across entries, so
 * a payload's size can't be predicted entry by entry without encoding it.
 */
function encodeWithinBudget(entries: PersistedEntry[]): string | null {
  let candidates = selectEntries(entries);

  while (candidates.length > 0) {
    const serialized = encodePayload(candidates);
    if (serialized.length <= MAX_PERSISTED_BYTES) return serialized;

    const overBy = serialized.length - MAX_PERSISTED_BYTES;
    const perEntry = serialized.length / candidates.length;
    const drop = Math.max(1, Math.min(candidates.length, Math.ceil(overBy / perEntry) + 1));
    candidates = candidates.slice(0, candidates.length - drop);
  }

  return null;
}

export async function loadPersisted(): Promise<PersistedEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  const payload = JSON.parse(raw) as EncodedPayload;
  if (payload?.v !== 1 || !Array.isArray(payload.e)) return [];

  const dictionary = Array.isArray(payload.d) ? payload.d : [];
  const oldestUsable = Date.now() - MAX_PERSISTED_AGE_MS;

  return payload.e
    .filter((entry) => typeof entry?.f === 'number' && entry.f >= oldestUsable)
    .map((entry) => decodeEntry(entry, dictionary))
    .filter((entry): entry is PersistedEntry => entry !== null);
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSnapshot: (() => PersistedEntry[]) | null = null;
let listeningForBackground = false;

async function write(): Promise<void> {
  const getEntries = pendingSnapshot;
  pendingSnapshot = null;
  if (!getEntries) return;

  try {
    const serialized = encodeWithinBudget(getEntries());
    if (serialized === null) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // A full or unavailable store shouldn't break forecasts; the cache still
    // works in memory and the next write may succeed after eviction.
  }
}

/** Writes any pending snapshot immediately, e.g. before the app backgrounds. */
export function flushPersist(): void {
  if (writeTimer !== null) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  void write();
}

function listenForBackground(): void {
  if (listeningForBackground) return;
  listeningForBackground = true;
  AppState.addEventListener('change', (state) => {
    if (state !== 'active') flushPersist();
  });
}

/**
 * Queues a debounced write of the cache. `getEntries` is called at write time
 * rather than now, so repeated calls while forecasts stream in collapse into a
 * single serialization of the final state.
 */
export function schedulePersist(getEntries: () => PersistedEntry[]): void {
  pendingSnapshot = getEntries;
  listenForBackground();

  if (writeTimer !== null) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    void write();
  }, WRITE_DEBOUNCE_MS);
}
