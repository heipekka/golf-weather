import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type StartTimeContextValue = {
  /** `null` means "use the real current time". */
  startTime: Date | null;
  setStartTime: (time: Date | null) => void;
};

const StartTimeContext = createContext<StartTimeContextValue | null>(null);

/**
 * Shares a single user-selected "start time" across every screen that reads
 * forecast/playability data, letting the whole app preview conditions at a
 * future hour instead of right now. Kept in-memory only (unlike sort mode)
 * since a picked time is inherently transient and would otherwise go stale
 * or fall outside the forecast window across app launches.
 */
export function StartTimeProvider({ children }: { children: ReactNode }) {
  const [startTime, setStartTime] = useState<Date | null>(null);

  const value = useMemo<StartTimeContextValue>(
    () => ({ startTime, setStartTime }),
    [startTime]
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
