import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useNavigationContainerRef, useRouter } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { TranslationKey } from '@/i18n';
import { clampWeight, weightFromLegacyMode, type SortMode } from '@/lib/course-sort';

const STORAGE_KEY = 'golf-weather.courseSort';

const LEGACY_SORT_MODES: SortMode[] = ['location', 'weather', 'combined'];

function isLegacySortMode(value: unknown): value is SortMode {
  return typeof value === 'string' && (LEGACY_SORT_MODES as string[]).includes(value);
}

/** Parses a persisted/URL sort value: a numeric weight (`"0.4"`), a legacy mode string, or invalid/missing -> `null`. */
function parseWeight(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  if (isLegacySortMode(value)) return weightFromLegacyMode(value);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return clampWeight(parsed);
}

/** Picks the courses subtitle translation key for a given weatherWeight. */
export function subtitleKeyForWeight(weight: number): TranslationKey {
  if (weight <= 0) return 'courses.subtitleLocation';
  if (weight >= 1) return 'courses.subtitleWeather';
  return 'courses.subtitleCombined';
}

type SetWeatherWeightOptions = {
  /** Whether to persist the new value to storage. Defaults to `true`; pass `false` for live drag updates. */
  persist?: boolean;
};

type SortModeContextValue = {
  weatherWeight: number;
  setWeatherWeight: (weight: number, options?: SetWeatherWeightOptions) => void;
};

const SortModeContext = createContext<SortModeContextValue | null>(null);

/**
 * Shares a single location/weather weight across every screen that renders
 * `SortControl` (Courses and Favorites), so dragging the slider on one
 * screen is instantly reflected on the other — mirroring `FavoritesProvider`.
 * Persists the latest value under `golf-weather.courseSort`, so relaunching
 * the app restores the last used weight. Accepts legacy `location` /
 * `weather` / `combined` strings (from older persisted values or deep
 * links) and migrates them to the equivalent numeric weight.
 */
export function SortModeProvider({ children }: { children: ReactNode }) {
  const [weatherWeight, setWeatherWeightState] = useState<number>(0);
  // Tracks whether `setWeatherWeight` has already fired (e.g. a deep-linked
  // `?sort=` param resolved via `useSortModeUrlSync`) before the storage
  // read below settles, so a slower storage read can't clobber it.
  const hasExternalOverrideRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled || hasExternalOverrideRef.current) return;
        const parsed = parseWeight(stored);
        if (parsed === null) return;
        setWeatherWeightState(parsed);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const setWeatherWeight = useCallback((weight: number, options?: SetWeatherWeightOptions) => {
    const clamped = clampWeight(weight);
    hasExternalOverrideRef.current = true;
    setWeatherWeightState(clamped);
    if (options?.persist === false) return;
    AsyncStorage.setItem(STORAGE_KEY, String(clamped)).catch(() => {});
  }, []);

  const value = useMemo<SortModeContextValue>(
    () => ({ weatherWeight, setWeatherWeight }),
    [weatherWeight, setWeatherWeight]
  );

  return <SortModeContext.Provider value={value}>{children}</SortModeContext.Provider>;
}

export function useCourseSort(): SortModeContextValue {
  const context = useContext(SortModeContext);
  if (!context) {
    throw new Error('useCourseSort must be used within a SortModeProvider');
  }
  return context;
}

/**
 * Reconciles the Courses screen's shared sort weight with the `?sort=` query
 * param (for direct linking): on mount, a valid `sort` param (numeric weight
 * or legacy mode string) wins outright. Every subsequent change is written
 * back to the URL as a numeric weight via `router.setParams` (an in-place
 * replace, no history entry) so the address bar always reflects the active
 * weight. Favorites has no such param, so it doesn't use this hook.
 */
export function useSortModeUrlSync(): void {
  const params = useLocalSearchParams<{ sort?: string }>();
  const router = useRouter();
  const navigationRef = useNavigationContainerRef();
  const { weatherWeight, setWeatherWeight } = useCourseSort();

  useEffect(() => {
    // A deep link wins outright, overriding both the current in-memory
    // value and whatever is persisted in storage (see `hasExternalOverrideRef`
    // in `SortModeProvider`).
    const paramWeight = parseWeight(params.sort);
    if (paramWeight !== null) {
      setWeatherWeight(paramWeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount; only cares whether a param was present initially.
  }, []);

  useEffect(() => {
    const currentParamWeight = parseWeight(params.sort);
    if (currentParamWeight === weatherWeight) return;

    // Slider drags update `weatherWeight` on every frame (with `persist:
    // false`); debounce so the URL only settles once dragging pauses,
    // instead of calling `router.setParams` dozens of times per drag.
    let cleanupFrame: (() => void) | undefined;
    const debounce = setTimeout(() => {
      // The navigation container can emit its initial state (and thus a
      // truthy root navigation state) before it actually reports ready via
      // `isReady()`. Calling `router.setParams` while not ready throws
      // "Attempted to navigate before mounting the Root Layout component.",
      // which is reliably hit when deep-linking straight into `/courses`
      // (skipping the `/` redirect that otherwise delays this mount). Retry
      // on the next frame until the container settles.
      let frame: ReturnType<typeof requestAnimationFrame> | undefined;
      const writeParam = () => {
        if (navigationRef.isReady()) {
          router.setParams({ sort: String(weatherWeight) });
          return;
        }
        frame = requestAnimationFrame(writeParam);
      };
      writeParam();

      cleanupFrame = () => {
        if (frame !== undefined) cancelAnimationFrame(frame);
      };
    }, 250);

    return () => {
      clearTimeout(debounce);
      cleanupFrame?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts to weatherWeight/param changes; navigationRef and router are stable refs.
  }, [weatherWeight, params.sort]);
}
