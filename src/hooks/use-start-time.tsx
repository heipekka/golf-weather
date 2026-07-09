import AsyncStorage from '@react-native-async-storage/async-storage';
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

const STORAGE_KEY = 'golf-weather.startTime';

type StartTimeContextValue = {
  /** `null` means "use the real current time". */
  startTime: Date | null;
  setStartTime: (time: Date | null) => void;
};

const StartTimeContext = createContext<StartTimeContextValue | null>(null);

/**
 * Shares a single user-selected "start time" across every screen that reads
 * forecast/playability data, letting the whole app preview conditions at a
 * future hour instead of right now. Persists the latest pick under
 * `golf-weather.startTime` (mirroring `SortModeProvider`), but only restores
 * it on load if it's still in the future — a stored time that has already
 * passed falls back to "now" instead.
 */
export function StartTimeProvider({ children }: { children: ReactNode }) {
  const [startTime, setStartTimeState] = useState<Date | null>(null);
  // Tracks whether `setStartTime` has already fired (e.g. the user picked a
  // time before the storage read below settles), so a slower storage read
  // can't clobber it.
  const hasExternalOverrideRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled || hasExternalOverrideRef.current || !stored) return;
        const parsed = new Date(stored);
        if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
          AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
          return;
        }
        setStartTimeState(parsed);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const setStartTime = useCallback((time: Date | null) => {
    hasExternalOverrideRef.current = true;
    setStartTimeState(time);
    if (time) {
      AsyncStorage.setItem(STORAGE_KEY, time.toISOString()).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  }, []);

  const value = useMemo<StartTimeContextValue>(
    () => ({ startTime, setStartTime }),
    [startTime, setStartTime]
  );

  return <StartTimeContext.Provider value={value}>{children}</StartTimeContext.Provider>;
}

export function useStartTime(): StartTimeContextValue {
  const context = useContext(StartTimeContext);
  if (!context) {
    throw new Error('useStartTime must be used within a StartTimeProvider');
  }
  return context;
}

/** Resolves a possibly-null start time to a concrete `Date`, falling back to now. */
export function resolveNow(startTime: Date | null): Date {
  return startTime ?? new Date();
}

/** Stable callback form of `resolveNow`, handy for passing as a default. */
export function useResolvedNow(): Date {
  const { startTime } = useStartTime();
  return resolveNow(startTime);
}
