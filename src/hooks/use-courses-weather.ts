import { useEffect, useRef, useState } from 'react';

import { useI18n } from '@/i18n';
import type { GolfCourseWithDistance } from '@/lib/geo';
import { fetchAllSources } from '@/lib/weather';
import type { CourseWeather } from '@/lib/weather';

// Bounds how many course forecasts are in flight at once, so browsing the
// full course list doesn't burst dozens of simultaneous requests at the
// weather providers.
const CONCURRENCY = 4;

// Individual course results are buffered and flushed to React state on this
// trailing interval, so dozens of near-simultaneous results collapse into a
// handful of renders instead of re-rendering the whole list per result.
const FLUSH_INTERVAL_MS = 1000;

export type CourseWeatherState = {
  weather: CourseWeather | null;
  loading: boolean;
  error: string | null;
};

export function useCoursesWeather(
  courses: GolfCourseWithDistance[],
  reloadToken?: number
): Record<string, CourseWeatherState> {
  const { t } = useI18n();
  const [state, setState] = useState<Record<string, CourseWeatherState>>({});
  const requestedRef = useRef(new Set<string>());
  const failedToLoadWeatherRef = useRef(t('errors.failedToLoadWeather'));
  failedToLoadWeatherRef.current = t('errors.failedToLoadWeather');

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

  const lastGenerationRef = useRef(reloadGeneration);

  useEffect(() => {
    let cancelled = false;
    const isReloadRun = reloadGeneration !== lastGenerationRef.current;
    lastGenerationRef.current = reloadGeneration;
    const pending = courses.filter((course) => !requestedRef.current.has(course.id));
    if (pending.length === 0) return;

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

    let cursor = 0;
    async function worker() {
      while (!cancelled && cursor < pending.length) {
        const course = pending[cursor++];
        try {
          const weather = await fetchAllSources(course.lat, course.lon, {
            forceRefresh: isReloadRun,
            onPartial: (partial) => {
              if (cancelled || partial.aggregated.length === 0) return;
              queueUpdate(course.id, { weather: partial, loading: false, error: null });
            },
          });
          if (!cancelled) {
            completed.add(course.id);
            queueUpdate(course.id, { weather, loading: false, error: null });
          }
        } catch (err) {
          if (!cancelled) {
            completed.add(course.id);
            queueUpdate(course.id, {
              weather: null,
              loading: false,
              error: err instanceof Error ? err.message : failedToLoadWeatherRef.current,
            });
          }
        }
      }
    }

    const workerCount = Math.min(CONCURRENCY, pending.length);
    for (let i = 0; i < workerCount; i++) {
      worker();
    }

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

  return state;
}
