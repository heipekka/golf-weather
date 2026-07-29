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

const STORAGE_KEY = 'golf-weather.bookmarks';

export type Bookmark = {
  id: string;
  courseId: string;
  /** ISO timestamp, floored to the hour. Absent for "now" bookmarks. */
  datetime?: string;
  /** True when this bookmark always tracks the live current hour rather than a fixed datetime. */
  isNow?: boolean;
};

function isBookmarkArray(value: unknown): value is Bookmark[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        typeof (entry as Bookmark).id === 'string' &&
        typeof (entry as Bookmark).courseId === 'string' &&
        ((entry as Bookmark).isNow === true || typeof (entry as Bookmark).datetime === 'string')
    )
  );
}

/** Floors a Date to the start of its hour, matching the hourly forecast granularity. */
export function floorToHour(date: Date): Date {
  const copy = new Date(date);
  copy.setMinutes(0, 0, 0);
  return copy;
}

/** True when `datetime` falls in the same hour as the real, live current time. */
export function isNowDate(datetime: Date): boolean {
  return floorToHour(datetime).getTime() === floorToHour(new Date()).getTime();
}

export function bookmarkId(courseId: string, datetime: Date): string {
  return isNowDate(datetime) ? `${courseId}-now` : `${courseId}-${floorToHour(datetime).toISOString()}`;
}

function isExpired(bookmark: Bookmark, now: Date): boolean {
  if (bookmark.isNow) return false;
  const time = new Date(bookmark.datetime ?? '').getTime();
  return Number.isNaN(time) || time < floorToHour(now).getTime();
}

type BookmarksContextValue = {
  bookmarks: Bookmark[];
  addBookmark: (courseId: string, datetime: Date) => void;
  removeBookmark: (id: string) => void;
  /** Moves an existing tee time to another course, keeping its hour. */
  replaceBookmark: (id: string, courseId: string) => void;
  hasBookmark: (courseId: string, datetime: Date) => boolean;
  pruneExpired: () => void;
};

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled || !stored) return;
        const parsed = JSON.parse(stored);
        if (!isBookmarkArray(parsed)) return;
        const now = new Date();
        const pruned = parsed.filter((bookmark) => !isExpired(bookmark, now));
        setBookmarks(pruned);
        if (pruned.length !== parsed.length) {
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pruned)).catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const addBookmark = useCallback(
    (courseId: string, datetime: Date) => {
      const id = bookmarkId(courseId, datetime);
      const isNow = isNowDate(datetime);
      setBookmarks((prev) => {
        if (prev.some((bookmark) => bookmark.id === id)) return prev;
        const next: Bookmark[] = [
          ...prev,
          isNow
            ? { id, courseId, isNow: true }
            : { id, courseId, datetime: floorToHour(datetime).toISOString() },
        ];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = prev.filter((bookmark) => bookmark.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const replaceBookmark = useCallback((id: string, courseId: string) => {
    setBookmarks((prev) => {
      const index = prev.findIndex((bookmark) => bookmark.id === id);
      if (index === -1) return prev;

      const current = prev[index];
      const datetime = current.isNow
        ? floorToHour(new Date())
        : new Date(current.datetime ?? '');
      if (Number.isNaN(datetime.getTime())) return prev;

      const nextId = bookmarkId(courseId, datetime);
      if (nextId === id) return prev;

      const replacement: Bookmark = current.isNow
        ? { id: nextId, courseId, isNow: true }
        : { id: nextId, courseId, datetime: floorToHour(datetime).toISOString() };

      // Replaced in place so the list keeps its position, unless that course
      // and hour is already bookmarked — then the old entry just goes away.
      const alreadyExists = prev.some((bookmark) => bookmark.id === nextId);
      const next = alreadyExists
        ? prev.filter((bookmark) => bookmark.id !== id)
        : prev.map((bookmark) => (bookmark.id === id ? replacement : bookmark));

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const hasBookmark = useCallback(
    (courseId: string, datetime: Date) => {
      const id = bookmarkId(courseId, datetime);
      return bookmarks.some((bookmark) => bookmark.id === id);
    },
    [bookmarks]
  );

  const pruneExpired = useCallback(() => {
    const now = new Date();
    setBookmarks((prev) => {
      const next = prev.filter((bookmark) => !isExpired(bookmark, now));
      if (next.length !== prev.length) {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      }
      return next;
    });
  }, []);

  const value = useMemo<BookmarksContextValue>(
    () => ({
      bookmarks,
      addBookmark,
      removeBookmark,
      replaceBookmark,
      hasBookmark,
      pruneExpired,
    }),
    [bookmarks, addBookmark, removeBookmark, replaceBookmark, hasBookmark, pruneExpired]
  );

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
}

export function useBookmarks(): BookmarksContextValue {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
}
