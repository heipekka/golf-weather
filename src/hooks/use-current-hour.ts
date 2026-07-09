import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { HOUR_ROLLOVER_MINUTE } from '@/lib/weather';

/** Computes the delay in ms until the next :45-past-the-hour rollover boundary. */
function msUntilNextRollover(from: Date): number {
  const next = new Date(from);
  next.setSeconds(0, 0);
  if (next.getMinutes() < HOUR_ROLLOVER_MINUTE) {
    next.setMinutes(HOUR_ROLLOVER_MINUTE);
  } else {
    next.setMinutes(HOUR_ROLLOVER_MINUTE);
    next.setHours(next.getHours() + 1);
  }
  return Math.max(next.getTime() - from.getTime(), 0);
}

/**
 * Maps a point in time to the rollover period it falls in, by shifting the
 * clock back by `HOUR_ROLLOVER_MINUTE` minutes before counting whole hours
 * since the epoch. The result only changes at each `HOUR_ROLLOVER_MINUTE`
 * boundary, so it can be compared before/after to tell whether a real
 * rollover happened (as opposed to e.g. just refocusing a browser tab).
 */
function rolloverBucket(from: Date): number {
  const shifted = from.getTime() - HOUR_ROLLOVER_MINUTE * 60_000;
  return Math.floor(shifted / (60 * 60_000));
}

/**
 * Ticks whenever the "current hour" used across the app should be
 * recomputed: at each `HOUR_ROLLOVER_MINUTE` boundary (so e.g. 9:00's data
 * stops showing at 9:45), and when the app returns to the foreground after
 * a boundary was crossed while it was backgrounded/hidden (e.g. the device
 * was asleep, or a browser tab was inactive). Foreground events that don't
 * cross a boundary are ignored, so merely refocusing a browser tab doesn't
 * force a refetch.
 *
 * Returns an opaque, incrementing token — consumers don't need its value,
 * just that it changes to trigger a re-render/refetch.
 */
export function useCurrentHour(): number {
  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBucketRef = useRef(rolloverBucket(new Date()));

  useEffect(() => {
    function scheduleNext() {
      const delay = msUntilNextRollover(new Date());
      timerRef.current = setTimeout(() => {
        lastBucketRef.current = rolloverBucket(new Date());
        setTick((t) => t + 1);
        scheduleNext();
      }, delay);
    }

    scheduleNext();

    // Only ticks on foreground if a rollover boundary was actually crossed
    // while backgrounded, so e.g. switching browser tabs (which also fires
    // an `AppState` "active" event via the Page Visibility API on web)
    // doesn't force a refetch within the same hour.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const bucket = rolloverBucket(new Date());
      if (bucket === lastBucketRef.current) return;
      lastBucketRef.current = bucket;
      setTick((t) => t + 1);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      subscription.remove();
    };
  }, []);

  return tick;
}
