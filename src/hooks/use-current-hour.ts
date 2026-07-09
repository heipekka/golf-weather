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
 * Ticks whenever the "current hour" used across the app should be
 * recomputed: at each `HOUR_ROLLOVER_MINUTE` boundary (so e.g. 9:00's data
 * stops showing at 9:45), and whenever the app returns to the foreground
 * (in case the device was asleep through a boundary).
 *
 * Returns an opaque, incrementing token — consumers don't need its value,
 * just that it changes to trigger a re-render/refetch.
 */
export function useCurrentHour(): number {
  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function scheduleNext() {
      const delay = msUntilNextRollover(new Date());
      timerRef.current = setTimeout(() => {
        setTick((t) => t + 1);
        scheduleNext();
      }, delay);
    }

    scheduleNext();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setTick((t) => t + 1);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      subscription.remove();
    };
  }, []);

  return tick;
}
