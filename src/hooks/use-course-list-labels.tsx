import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'golf-weather.courseListLabels';

type CourseListLabelsContextValue = {
  courseListLabelsEnabled: boolean;
  setCourseListLabelsEnabled: (enabled: boolean) => void;
};

const CourseListLabelsContext = createContext<CourseListLabelsContextValue | null>(null);

/**
 * Shares whether membership labels (Kultakortti, Järvi-Suomi, GolfAmore)
 * are shown on course cards and the course detail screen. Defaults to `true`
 * and persists the choice under `golf-weather.courseListLabels`.
 */
export function CourseListLabelsProvider({ children }: { children: ReactNode }) {
  const [courseListLabelsEnabled, setEnabledState] = useState(true);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled || stored === null) return;
        setEnabledState(stored === 'true');
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const setCourseListLabelsEnabled = useCallback((enabled: boolean) => {
    setEnabledState(enabled);
    AsyncStorage.setItem(STORAGE_KEY, String(enabled)).catch(() => {});
  }, []);

  const value = useMemo<CourseListLabelsContextValue>(
    () => ({ courseListLabelsEnabled, setCourseListLabelsEnabled }),
    [courseListLabelsEnabled, setCourseListLabelsEnabled],
  );

  return (
    <CourseListLabelsContext.Provider value={value}>{children}</CourseListLabelsContext.Provider>
  );
}

export function useCourseListLabels(): CourseListLabelsContextValue {
  const context = useContext(CourseListLabelsContext);
  if (!context) {
    throw new Error('useCourseListLabels must be used within a CourseListLabelsProvider');
  }
  return context;
}
