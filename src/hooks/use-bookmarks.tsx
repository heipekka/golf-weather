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
  /** ISO timestamp, floored to the hour. */
  datetime: string;
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
        typeof (entry as Bookmark).datetime === 'string'
    )
  );
}

/** Floors a Date to the start of its hour, matching the hourly forecast granularity. */
export function floorToHour(date: Date): Date {
  const copy = new Date(date);
  copy.setMinutes(0, 0, 0);
  return copy;
}

function bookmarkId(courseId: string, datetime: Date): string {
  return `${courseId}-${floorToHour(datetime).toISOString()}`;
}

function isExpired(bookmark: Bookmark, now: Date): boolean {
  const time = new Date(bookmark.datetime).getTime();
  return Number.isNaN(time) || time < floorToHour(now).getTime();
}

type BookmarksContextValue = {
  bookmarks: Bookmark[];
  addBookmark: (courseId: string, datetime: Date) => void;
  removeBookmark: (id: string) => void;
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
      setBookmarks((prev) => {
        if (prev.some((bookmark) => bookmark.id === id)) return prev;
        const next = [...prev, { id, courseId, datetime: floorToHour(datetime).toISOString() }];
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
    () => ({ bookmarks, addBookmark, removeBookmark, hasBookmark, pruneExpired }),
    [bookmarks, addBookmark, removeBookmark, hasBookmark, pruneExpired]
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
