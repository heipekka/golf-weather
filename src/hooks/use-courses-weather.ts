import { useCallback, useEffect, useRef, useState } from 'react';

import { useI18n } from '@/i18n';
import type { GolfCourseWithDistance } from '@/lib/geo';
import { fetchCoursesWeather } from '@/lib/weather';
import type { CourseWeather } from '@/lib/weather';

// Individual course results are buffered and flushed to React state on this
// trailing interval, so dozens of near-simultaneous results collapse into a
// handful of renders instead of re-rendering the whole list per result.
const FLUSH_INTERVAL_MS = 1000;

// Forced refreshes are spread over this window. Every mounted screen reacts to
// the same hour rollover at the same instant, and spacing them out keeps their
// requests from arriving as one burst at the providers. In-flight requests are
// already shared across screens, so this is a second line of defence.
const MAX_REFRESH_JITTER_MS = 1500;

export type CourseWeatherState = {
  weather: CourseWeather | null;
  loading: boolean;
  error: string | null;
};

export type UseCoursesWeatherResult = {
  weatherByCourse: Record<string, CourseWeatherState>;
  refresh: () => void;
  refreshing: boolean;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useCoursesWeather(
  courses: GolfCourseWithDistance[],
  reloadToken?: number
): UseCoursesWeatherResult {
  const { t } = useI18n();
  const [state, setState] = useState<Record<string, CourseWeatherState>>({});
  const requestedRef = useRef(new Set<string>());
  // Held in a ref rather than read directly in the fetch effect, so switching
  // language updates the message without re-triggering a refetch.
  const failedToLoadWeatherRef = useRef(t('errors.failedToLoadWeather'));
  useEffect(() => {
    failedToLoadWeatherRef.current = t('errors.failedToLoadWeather');
  }, [t]);

  // Buffers individual course results so they can be flushed to state in
  // batches (see `FLUSH_INTERVAL_MS`) instead of one `setState` per result.
  const pendingRef = useRef<Record<string, CourseWeatherState>>({});
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flushPending() {
    flushTimerRef.current = null;
    const buffered = pendingRef.current;
    pendingRef.current = {};
    if (Object.keys(buffered).length === 0) return;
    setState((prev) => ({ ...prev, ...buffered }));
  }

  function queueUpdate(id: string, next: CourseWeatherState) {
    pendingRef.current[id] = next;
    if (flushTimerRef.current === null) {
      flushTimerRef.current = setTimeout(flushPending, FLUSH_INTERVAL_MS);
    }
  }

  // Bumps `reloadGeneration` (and clears what's already been requested) each
  // time `reloadToken` changes, e.g. at an hourly rollover boundary, so the
  // main effect below re-fetches every course rather than just re-labeling
  // stale data under the new hour.
  const [reloadGeneration, setReloadGeneration] = useState(0);
  const seenReloadTokenRef = useRef(reloadToken);
  useEffect(() => {
    if (reloadToken === undefined || reloadToken === seenReloadTokenRef.current) return;
    seenReloadTokenRef.current = reloadToken;
    requestedRef.current.clear();
    setReloadGeneration((g) => g + 1);
  }, [reloadToken]);

  // Manual pull-to-refresh: forces every currently-listed course to re-fetch,
  // same as an hourly rollover, and tracks completion via `refreshing` so
  // callers can drive a `RefreshControl` off the weather fetch itself rather
  // than an unrelated loading state (e.g. GPS).
  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(() => {
    requestedRef.current.clear();
    setRefreshing(true);
    setReloadGeneration((g) => g + 1);
  }, []);

  const lastGenerationRef = useRef(reloadGeneration);

  useEffect(() => {
    let cancelled = false;
    const isReloadRun = reloadGeneration !== lastGenerationRef.current;
    lastGenerationRef.current = reloadGeneration;
    const pending = courses.filter((course) => !requestedRef.current.has(course.id));
    if (pending.length === 0) {
      if (isReloadRun) setRefreshing(false);
      return;
    }

    pending.forEach((course) => requestedRef.current.add(course.id));
    setState((prev) => {
      const next = { ...prev };
      for (const course of pending) {
        next[course.id] = { weather: null, loading: true, error: null };
      }
      return next;
    });

    // Tracks courses whose request settled while this effect run was still
    // active, so a cancelled run can release the rest back for re-fetching.
    const completed = new Set<string>();

    async function load() {
      if (isReloadRun) await delay(Math.random() * MAX_REFRESH_JITTER_MS);
      if (cancelled) return;

      // Concurrency, retries and caching all live in `@/lib/weather`, which
      // batches Open-Meteo into a single request for the whole list and caps
      // in-flight requests per provider across every screen.
      const results = await fetchCoursesWeather(
        pending.map((course) => ({ lat: course.lat, lon: course.lon })),
        {
          forceRefresh: isReloadRun,
          onPartial: (index, partial) => {
            if (cancelled || partial.aggregated.length === 0) return;
            queueUpdate(pending[index].id, { weather: partial, loading: false, error: null });
          },
        }
      );
      if (cancelled) return;

      results.forEach((weather, index) => {
        const course = pending[index];
        completed.add(course.id);

        if (weather.aggregated.length > 0) {
          queueUpdate(course.id, { weather, loading: false, error: null });
          return;
        }

        // Not one provider returned usable data, and none had a previous value
        // to fall back on. Release the course so the next run retries it
        // instead of leaving the card empty for the rest of the session.
        requestedRef.current.delete(course.id);
        queueUpdate(course.id, {
          weather: null,
          loading: false,
          error: failedToLoadWeatherRef.current,
        });
      });
    }

    load().finally(() => {
      if (!cancelled && isReloadRun) setRefreshing(false);
    });

    return () => {
      cancelled = true;
      // Release any course that didn't finish this run, so the next effect
      // run (e.g. after location resolves and re-sorts the list) re-fetches
      // it instead of leaving it stuck on the initial loading state.
      for (const course of pending) {
        if (!completed.has(course.id)) {
          requestedRef.current.delete(course.id);
        }
      }
      // Flush any results buffered but not yet flushed, so completed
      // courses aren't left stuck on `loading: true`.
      if (flushTimerRef.current !== null) {
        clearTimeout(flushTimerRef.current);
      }
      flushPending();
    };
  }, [courses, reloadGeneration]);

  return { weatherByCourse: state, refresh, refreshing };
}
