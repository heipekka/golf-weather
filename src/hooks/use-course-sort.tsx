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
import { type SortMode } from '@/lib/course-sort';

const STORAGE_KEY = 'golf-weather.courseSort';

const SORT_MODES: SortMode[] = ['location', 'weather', 'combined'];

export const SUBTITLE_KEY_BY_MODE: Record<SortMode, TranslationKey> = {
  location: 'courses.subtitleLocation',
  weather: 'courses.subtitleWeather',
  combined: 'courses.subtitleCombined',
};

function isSortMode(value: unknown): value is SortMode {
  return typeof value === 'string' && (SORT_MODES as string[]).includes(value);
}

type SortModeContextValue = {
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
};

const SortModeContext = createContext<SortModeContextValue | null>(null);

/**
 * Shares a single sort mode across every screen that renders `SortControl`
 * (Courses and Favorites), so switching the tab on one screen is instantly
 * reflected on the other — mirroring `FavoritesProvider`. Persists the
 * latest choice under `golf-weather.courseSort`, so relaunching the app
 * restores the last used tab.
 */
export function SortModeProvider({ children }: { children: ReactNode }) {
  const [sortMode, setSortModeState] = useState<SortMode>('location');
  // Tracks whether `setSortMode` has already fired (e.g. a deep-linked
  // `?sort=` param resolved via `useSortModeUrlSync`) before the storage
  // read below settles, so a slower storage read can't clobber it.
  const hasExternalOverrideRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled || hasExternalOverrideRef.current || !isSortMode(stored)) return;
        setSortModeState(stored);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const setSortMode = useCallback((mode: SortMode) => {
    hasExternalOverrideRef.current = true;
    setSortModeState(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  }, []);

  const value = useMemo<SortModeContextValue>(() => ({ sortMode, setSortMode }), [sortMode, setSortMode]);

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
 * Reconciles the Courses screen's shared sort mode with the `?sort=` query
 * param (for direct linking): on mount, a valid `sort` param wins outright.
 * Every subsequent change is written back to the URL via `router.setParams`
 * (an in-place replace, no history entry) so the address bar always
 * reflects the active tab. Favorites has no such param, so it doesn't use
 * this hook.
 */
export function useSortModeUrlSync(): void {
  const params = useLocalSearchParams<{ sort?: string }>();
  const router = useRouter();
  const navigationRef = useNavigationContainerRef();
  const { sortMode, setSortMode } = useCourseSort();

  useEffect(() => {
    // A deep link wins outright, overriding both the current in-memory
    // value and whatever is persisted in storage (see `hasExternalOverrideRef`
    // in `SortModeProvider`).
    const paramSortMode = isSortMode(params.sort) ? params.sort : null;
    if (paramSortMode) {
      setSortMode(paramSortMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount; only cares whether a param was present initially.
  }, []);

  useEffect(() => {
    if (params.sort === sortMode) return;

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
        router.setParams({ sort: sortMode });
        return;
      }
      frame = requestAnimationFrame(writeParam);
    };
    writeParam();

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts to sortMode/param changes; navigationRef and router are stable refs.
  }, [sortMode, params.sort]);
}
